import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import * as Crypto from '../utils/crypto';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string; // Decrypted content
  type: 'text' | 'image' | 'file' | 'invite';
  file_url?: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
}

export interface Conversation {
  id: string;
  participants: any[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_group: boolean;
  name?: string;
  logo?: string;
  group_detail?: string;
  people_inside_it?: any[];
  category_id?: string;
  category?: { name: string };
}

export const useMessenger = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Typing Status
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  // Presence Status
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // E2EE Keys
  const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
  const [myPublicKey, setMyPublicKey] = useState<CryptoKey | null>(null);

  // Initialize Keys
  useEffect(() => {
    const initKeys = async () => {
      if (!user) return;
      
      // 1. Check Local Storage for Private Key
      const storedKey = localStorage.getItem(`agencyos_priv_key_${user.uid}`);
      
      if (storedKey) {
        const jwk = JSON.parse(storedKey);
        const privateKey = await Crypto.importPrivateKey(jwk);
        setMyPrivateKey(privateKey);
        // We assume public key is already on server or we can regenerate/fetch it
      } else {
        // Generate New Identity
        const keyPair = await Crypto.generateIdentityKeyPair();
        setMyPrivateKey(keyPair.privateKey);
        setMyPublicKey(keyPair.publicKey);
        
        // Store Private Key Locally (In real app, encrypt this with user password!)
        const jwk = await Crypto.exportKey(keyPair.privateKey);
        localStorage.setItem(`agencyos_priv_key_${user.uid}`, JSON.stringify(jwk));
        
        // Upload Public Key to Server
        const pubJwk = await Crypto.exportKey(keyPair.publicKey);
        // await supabase.from('user_keys').upsert({ user_id: user.uid, public_key: pubJwk });
      }
    };
    initKeys();
  }, [user]);

  // Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      // 1. Fetch conversations where current user is a participant and in the current workspace
      const { data: participantData, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(workspace_id)
        `)
        .eq('user_id', user.uid)
        .eq('conversations.workspace_id', currentWorkspace.id);

      if (partError) throw partError;
      
      const conversationIds = (participantData || []).map(p => p.conversation_id);
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Fetch the actual conversation details
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user_id, role),
          category:categories(name)
        `)
        .in('id', conversationIds)
        .eq('workspace_id', currentWorkspace.id)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      console.log(`[Messenger] Fetched ${conversations?.length || 0} conversations for user ${user.uid}`);
      if (conversations) {
          conversations.forEach(c => {
              console.log(`[Messenger] Conv ${c.id}: ${c.participants?.length || 0} participants`);
          });
      }

      setConversations(conversations || []);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      if (err.code === '42P01') { // Undefined table
          setError("Database tables missing. Please run the provided SQL schema.");
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  // Fetch Messages for a Conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to Realtime
  useEffect(() => {
    if (!user || !currentWorkspace) return;

    const channel = supabase.channel('messenger_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
            const current = prev[newMsg.conversation_id] || [];
            
            // 1. Check if ID already exists (already reconciled by sendMessage)
            if (current.find(m => m.id === newMsg.id)) return prev;
            
            // 2. Check if it's an optimistic message we sent that hasn't been reconciled yet
            if (newMsg.sender_id === user.uid) {
                const optimistic = current.find(m => m.id.startsWith('temp-') && m.content === newMsg.content);
                if (optimistic) {
                    return {
                        ...prev,
                        [newMsg.conversation_id]: current.map(m => m.id === optimistic.id ? newMsg : m)
                    };
                }
            }

            return {
                ...prev,
                [newMsg.conversation_id]: [...current, newMsg]
            };
        });

        // Mark as delivered if not from me
        if (newMsg.sender_id !== user.uid) {
          updateMessageStatus(newMsg.id, 'delivered');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => {
          const current = prev[updatedMsg.conversation_id] || [];
          return {
            ...prev,
            [updatedMsg.conversation_id]: current.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
          };
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'typing_status' }, (payload) => {
        const status = payload.new;
        setTypingUsers(prev => {
          const users = prev[status.conversation_id] || [];
          if (status.is_typing && !users.includes(status.user_id)) {
            return { ...prev, [status.conversation_id]: [...users, status.user_id] };
          } else if (!status.is_typing) {
            return { ...prev, [status.conversation_id]: users.filter(id => id !== status.user_id) };
          }
          return prev;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'typing_status' }, (payload) => {
        const status = payload.new;
        setTypingUsers(prev => {
          const users = prev[status.conversation_id] || [];
          if (status.is_typing && !users.includes(status.user_id)) {
            return { ...prev, [status.conversation_id]: [...users, status.user_id] };
          } else if (!status.is_typing) {
            return { ...prev, [status.conversation_id]: users.filter(id => id !== status.user_id) };
          }
          return prev;
        });
      })
      .subscribe();

    // Presence Channel
    const presenceChannel = supabase.channel(`presence:${currentWorkspace.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => onlineIds.add(p.user_id));
        });
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          newPresences.forEach((p: any) => next.add(p.user_id));
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          leftPresences.forEach((p: any) => next.delete(p.user_id));
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.uid, online_at: new Date().toISOString() });
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(presenceChannel);
    };
  }, [user, currentWorkspace]);

  // Send Message
  const sendMessage = async (conversationId: string, text: string, type: 'text' | 'image' | 'file' | 'invite' = 'text', fileUrl?: string, fileName?: string, fileSize?: number) => {
    if (!user || !currentWorkspace) return;

    const payload = {
      workspace_id: currentWorkspace.id,
      conversation_id: conversationId,
      sender_id: user.uid,
      content: text, 
      type,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      created_at: new Date().toISOString()
    };
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = { ...payload, id: tempId, status: 'sent' };
    
    setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMsg as any]
    }));

    const { data: inserted, error } = await supabase.from('messages').insert([payload]).select().single();
    
    if (error) {
        console.error("Send failed:", error);
        // Remove optimistic update on failure
        setMessages(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(m => m.id !== tempId)
        }));
    } else {
        // Replace optimistic message with real one to prevent duplicates when real-time event arrives
        if (inserted) {
          setMessages(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).map(m => m.id === tempId ? inserted : m)
          }));
        }

        // Update conversation last message
        await supabase.from('conversations').update({
            last_message: text,
            last_message_at: new Date().toISOString()
        }).eq('id', conversationId);
    }
  };

  // Create New Conversation
  const createConversation = async (participantIds: string[], isGroup: boolean = false, name?: string) => {
    if (!user || !currentWorkspace) {
        console.error("createConversation: User not authenticated or no workspace");
        return null;
    }

    console.log("createConversation: Starting", { participantIds, isGroup, name });

    // Check if exists (for 1:1)
    if (!isGroup && participantIds.length === 1) {
        const targetId = participantIds[0];
        const existing = conversations.find(c => 
            !c.is_group && c.participants.some((p: any) => p.user_id === targetId)
        );
        if (existing) {
            console.log("createConversation: Found existing", existing.id);
            return existing.id;
        }
    }

    // Use RPC to create conversation and add participants atomically
    // Ensure p_name is null, not undefined, to match SQL signature
    const { data: convId, error: rpcError } = await supabase.rpc('create_new_conversation', {
        p_workspace_id: currentWorkspace.id,
        p_participant_ids: Array.from(new Set([user.uid, ...participantIds])),
        p_is_group: isGroup,
        p_name: name || (isGroup ? 'New Group' : null)
    });

    if (rpcError) {
        console.error("createConversation: RPC failed, trying direct insert:", rpcError);
        
        // Fallback: Direct insert
        try {
            const { data: conv, error: convError } = await supabase.from('conversations').insert([{
                workspace_id: currentWorkspace.id,
                is_group: isGroup,
                name: name || (isGroup ? 'New Group' : null),
                last_message_at: new Date().toISOString()
            }]).select().single();

            if (convError) throw convError;
            if (!conv) throw new Error("Failed to create conversation");

            const participants = Array.from(new Set([user.uid, ...participantIds])).map(uid => ({
                conversation_id: conv.id,
                user_id: uid
            }));

            const { error: partError } = await supabase.from('conversation_participants').insert(participants);
            if (partError) throw partError;

            console.log("createConversation: Fallback successful", conv.id);
            return conv.id;
        } catch (err: any) {
            console.error("createConversation: Fallback failed:", err);
            alert("Database Error: " + err.message);
            return null;
        }
    }

    console.log("createConversation: Created conv via RPC", convId);

    if (isGroup && convId) {
        const { error: updateError } = await supabase.from('conversations').update({
            people_inside_it: [user.uid, ...participantIds]
        }).eq('id', convId);
        if (updateError) {
            console.error("createConversation: Failed to update people_inside_it", updateError);
        }

        // Fix roles: set added participants to 'member'
        if (participantIds.length > 0) {
            await supabase.from('conversation_participants')
                .update({ role: 'member' })
                .eq('conversation_id', convId)
                .in('user_id', participantIds);
        }
    }

    // Refresh list
    fetchConversations();
    return convId;
  };

  const sendTypingStatus = async (conversationId: string, isTyping: boolean) => {
    if (!user) return;
    
    // Using upsert to handle typing status
    const { error } = await supabase.from('typing_status').upsert({
      conversation_id: conversationId,
      user_id: user.uid,
      is_typing: isTyping,
      updated_at: new Date().toISOString()
    });
    
    if (error) console.error("Error sending typing status:", error);
  };

  const updateMessageStatus = async (messageId: string, status: 'delivered' | 'read') => {
    const { error } = await supabase.from('messages').update({
      status,
      read_at: status === 'read' ? new Date().toISOString() : null
    }).eq('id', messageId);
    
    if (error) console.error("Error updating message status:", error);
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    const { error } = await supabase.from('conversations').update(updates).eq('id', id);
    if (error) throw error;
    fetchConversations();
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) throw error;
    fetchConversations();
  };

  return {
    conversations,
    messages,
    loading,
    error,
    typingUsers,
    onlineUsers,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    sendTypingStatus,
    updateMessageStatus,
    updateConversation,
    deleteConversation
  };
};
