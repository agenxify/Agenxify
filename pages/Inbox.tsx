
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Plus, MoreVertical, Phone, Video, Info, 
  Image as ImageIcon, Paperclip, Mic, Smile, Send, 
  Check, CheckCircle2, MoreHorizontal, ArrowLeft,
  FileText, X, User, Bell, Shield, ShieldAlert, Clock, MessageSquare,
  Users, Building2, SmilePlus, Heart, Zap, Flag, Hash, UserPlus, BellOff,
  Maximize2, Download, Music, Rocket, ArrowUpRight, Settings, FolderPlus,
  ChevronRight, Trash2, Edit3, Camera, Volume2, Square
} from 'lucide-react';
import { MOCK_CLIENTS, MOCK_PROFILES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { supabase } from '../supabase';
import { useMessenger } from '../hooks/useMessenger';
import { useTeam } from '../hooks/useTeam';
import { useClients } from '../hooks/useClients';
import { useOnboarding } from '../hooks/useOnboarding';
import * as ReactRouterDom from 'react-router-dom';

const { useNavigate, useLocation } = ReactRouterDom as any;

// --- Types ---
// (We use types from hook now, but keep UI specific ones if needed)
// Redefining Message for UI compatibility or mapping
interface UIMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'invite';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: 'sent' | 'delivered' | 'read';
  payload?: any;
}

interface UIConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  participantType: 'Team' | 'Client' | '';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  isMuted?: boolean;
  group_detail?: string;
  logo?: string;
  people_inside_it?: any[];
  category?: string;
  messages: UIMessage[];
}

const EMOJI_CATEGORIES = [
  { id: 'smileys', label: 'Smileys', icon: Smile, emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"] },
  { id: 'people', label: 'People', icon: User, emojis: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁", "👅", "👄"] },
  { id: 'objects', label: 'Objects', icon: Zap, emojis: ["👓", "🕶", "🥽", "🥼", "🦺", "👔", "👕", "👖", "🧣", "🧤", "🧥", "🧦", "👗", "👘", "🥻", "🩱", "🩲", "🩳", "👙", "👚", "👛", "👜", "👝", "🎒", "👞", "👟", "🥾", "🥿", "👠", "👡", "🩰", "👢", "👑", "👒", "🎩", "🎓", "🧢", "⛑", "🪖", "💄", "💍", "💼"] },
  { id: 'symbols', label: 'Symbols', icon: Heart, emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈️", "♉️", "♊️", "♋️", "♋️", "♌️", "♍️", "♎️", "♏️", "♐️", "♑️", "♒️", "♓️", "🆔", "⚛️"] }
];

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  // --- Backend Hook ---
  const { 
    conversations: dbConversations, 
    messages: dbMessages, 
    loading: dbLoading, 
    error: dbError,
    typingUsers,
    onlineUsers,
    fetchConversations, 
    fetchMessages, 
    sendMessage,
    createConversation,
    sendTypingStatus,
    updateMessageStatus,
    updateConversation,
    deleteConversation: dbDeleteConversation
  } = useMessenger();

  const { members: teamMembers } = useTeam();
  const { clients: clientList } = useClients();
  const { flows: onboardingFlows, fetchFlows } = useOnboarding();

  // --- State ---
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [showOnboardingPicker, setShowOnboardingPicker] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
        if (!currentWorkspace?.id) return;
        
        try {
            // Try the backend API first to bypass RLS
            const response = await fetch(`/api/admin-profile?workspaceId=${currentWorkspace.id}`);
            if (response.ok) {
                const profile = await response.json();
                setAdminProfile({
                    ...profile,
                    userId: currentWorkspace.owner_id
                });
                return;
            }

            // Fallback to direct supabase if API fails
            const { data: profileById } = await supabase
                .from('team_member')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .eq('id', currentWorkspace.owner_id)
                .maybeSingle();
            
            if (profileById) {
                setAdminProfile({
                    ...profileById,
                    userId: currentWorkspace.owner_id
                });
                return;
            }

            // 2. Fallback: Get the owner's email from workspace_members
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('email, user_id')
                .eq('workspace_id', currentWorkspace.id)
                .eq('user_id', currentWorkspace.owner_id)
                .maybeSingle();
                
            const ownerEmail = memberData?.email;
            
            if (ownerEmail) {
                // 3. Get the profile from team_member by email
                const { data: profileByEmail } = await supabase
                    .from('team_member')
                    .select('*')
                    .eq('workspace_id', currentWorkspace.id)
                    .ilike('email', ownerEmail)
                    .maybeSingle();
                    
                if (profileByEmail) {
                    setAdminProfile({
                        ...profileByEmail,
                        userId: currentWorkspace.owner_id
                    });
                    return;
                }
            }
            
            // 4. Final Fallback: Try to find any admin in team_member
            const { data: anyAdmin } = await supabase
                .from('team_member')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .eq('role', 'admin')
                .maybeSingle();
                
            if (anyAdmin) {
                const { data: adminMember } = await supabase
                    .from('workspace_members')
                    .select('user_id')
                    .eq('workspace_id', currentWorkspace.id)
                    .ilike('email', anyAdmin.email)
                    .maybeSingle();
                    
                setAdminProfile({
                    ...anyAdmin,
                    userId: adminMember?.user_id || anyAdmin.id
                });
            } else if (currentWorkspace.owner_id) {
                // If still nothing, set a basic profile based on workspace owner
                setAdminProfile({
                    name: 'Admin',
                    userId: currentWorkspace.owner_id,
                    avatar: `https://ui-avatars.com/api/?name=Admin&background=random`
                });
            }
        } catch (err) {
            console.error("Error fetching admin profile:", err);
        }
    };
    fetchAdmin();
  }, [currentWorkspace?.id, currentWorkspace?.owner_id]);
  
  // --- Mapped Conversations ---
  const getMemberInfo = (id: string) => {
     if (!id) return { name: 'Unknown', avatar: `https://i.pravatar.cc/150?u=unknown`, role: '', type: '' };

     if (id === 'current' || id === currentUser?.uid) {
         return { 
           name: currentUser?.name || 'You', 
           avatar: currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.uid}`, 
           role: currentUser?.role === 'admin' ? 'Admin' : 'Me', 
           type: 'Team' 
         };
     }

     const client = clientList.find(c => c.userId === id || c.id === id);
     if (client) return { name: client.name || client.company || 'Unknown Client', avatar: client.avatar, role: 'Client', type: 'Client' };
     
     const member = teamMembers.find(t => t.userId === id || t.id === id);
     if (member) return { name: member.name, avatar: member.avatar, role: member.role, type: 'Team' };

     // Fallback for Admin if not in team list
     if (id === 'admin' || id === currentWorkspace?.owner_id || (adminProfile && (id === adminProfile.id || id === adminProfile.userId))) {
         const name = adminProfile?.name || 'Admin';
         return { 
           name, 
           avatar: adminProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`, 
           role: 'Admin', 
           type: 'Team' 
         };
     }

     return { name: 'User ' + id.slice(0, 4), avatar: `https://i.pravatar.cc/150?u=${id}`, role: '', type: '' };
  };

  const conversations: UIConversation[] = useMemo(() => {
    return dbConversations.map(c => {
       // Resolve Participant (The other person)
       let participantId = 'unknown';
       let participantName = 'Unknown User';
       let participantAvatar = 'https://i.pravatar.cc/150?u=unknown';
       let participantRole = 'User';
       let participantType: 'Team' | 'Client' | '' = '';
       let isOnline = false;

       if (c.is_group) {
           participantName = c.name || 'Group Chat';
           participantAvatar = c.logo 
             ? c.logo 
             : `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=random`;
           participantRole = (Array.isArray(c.category) ? c.category[0]?.name : (c.category as any)?.name) || 'Group';
           participantId = c.id;
           participantType = 'Team';
       } else {
           // Find the other participant
           const other = c.participants.find((p: any) => p.user_id !== currentUser?.uid);
           if (other) {
               participantId = other.user_id;
               isOnline = onlineUsers.has(participantId);
               
               const info = getMemberInfo(participantId);
               participantName = info.name;
               participantAvatar = info.avatar;
               participantRole = info.role;
               participantType = info.type as any;
           }
       }

       // Map Messages
       const msgs = (dbMessages[c.id] || []).map(m => ({
           id: m.id,
           senderId: m.sender_id === currentUser?.uid ? 'current' : m.sender_id,
           text: m.content,
           timestamp: m.created_at,
           type: m.type,
           fileUrl: m.file_url,
           fileName: m.file_name, // Fixed prop name
           fileSize: m.file_size, // Fixed prop name
           status: m.status,
            payload: m.type === 'invite' ? JSON.parse(m.content) : undefined
       } as UIMessage));

       return {
           id: c.id,
           participantId,
           participantName,
           participantAvatar,
           participantRole,
           participantType,
           lastMessage: c.last_message || 'Start chatting',
           lastMessageTime: c.last_message_at || c.created_at,
           unreadCount: 0, // TODO
           isOnline,
           isGroup: c.is_group,
           group_detail: c.group_detail,
           logo: c.logo,
           people_inside_it: c.people_inside_it,
           category: Array.isArray(c.category) ? c.category[0]?.name : (c.category as any)?.name,
           messages: msgs
       };
    });
  }, [dbConversations, dbMessages, clientList, teamMembers, currentUser]);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  
  const [showChatActions, setShowChatActions] = useState(false);
  const [previewFile, setPreviewFile] = useState<Message | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Categories State
  const [activeCategory, setActiveCategory] = useState('All');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('agencyos_chat_categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [conversationCategories, setConversationCategories] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('agencyos_conv_categories');
    return saved ? JSON.parse(saved) : {};
  });

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Group Settings State
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupCategory, setEditGroupCategory] = useState('');
  const [editGroupLogo, setEditGroupLogo] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // --- Check for Share Intent via Query Params ---
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const msg = searchParams.get('msg');
    if (msg) {
        setInputText(decodeURIComponent(msg));
        setShowNewChatModal(true);
    }
  }, [location.search]);

  // --- Initialization ---
  useEffect(() => {
    fetchConversations();
    fetchFlows();
  }, [fetchConversations, fetchFlows]);

  // --- Handlers ---

  // --- Handlers ---

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowMobileList(false);
    fetchMessages(id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowChatActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
        const { scrollHeight, clientHeight } = messagesContainerRef.current;
        messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [activeConversationId, conversations]); 

  // Detect and Parse JSON Payload for Cards
  const parseMessage = (text: string): { isPayload: boolean, data: any, display: string } => {
      try {
          if (text.trim().startsWith('{')) {
             const data = JSON.parse(text);
             if (data.type === 'onboarding_invite') {
                 return { isPayload: true, data, display: 'Onboarding Invite' };
             }
          }
      } catch (e) {
        console.error("Error parsing message payload", e);
      }
      return { isPayload: false, data: null, display: text };
  };

  const handleSendMessage = async (text: string = inputText, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string, fileSize?: number, targetId?: string) => {
    const chatId = targetId || activeConversationId;
    if ((!text.trim() && type === 'text') || !chatId) return;

    const { isPayload, data, display } = parseMessage(text);
    
    // Call Hook
    await sendMessage(
        chatId, 
        isPayload ? display : text, 
        isPayload ? 'invite' : type, 
        fileUrl, 
        fileName, 
        fileSize
    );

    if (!targetId) setInputText('');
  };

  const handleSendOnboardingInvite = async (flow: any) => {
    if (!activeConversationId) return;
    
    const inviteLink = `${window.location.origin}/#/onboarding/view/${flow.id}`;
    const payload = {
        type: 'onboarding_invite',
        flowId: flow.id,
        flowName: flow.name,
        url: inviteLink,
        description: 'Please complete this secure onboarding protocol to proceed.'
    };

    await sendMessage(activeConversationId, JSON.stringify(payload), 'invite');
    setShowOnboardingPicker(false);
    setShowChatActions(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        handleSendMessage(file.name, type, url, file.name, file.size);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startNewChat = async (user: any, role: 'Client' | 'Team') => {
    let targetId = user.userId;

    // If no userId, try to find it from workspace_members or team_member by email
    if (!targetId && user.email) {
        const { data: member } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', currentWorkspace?.id)
            .ilike('email', user.email)
            .maybeSingle();
        
        if (member?.user_id) {
            targetId = member.user_id;
        }
    }

    if (!targetId) {
        // If still no targetId, we can't create a real conversation in the DB
        // but we'll show a message instead of a blocking alert
        console.warn("Cannot start chat: No user ID found for", user.email);
        alert("This user hasn't joined the portal yet. We've sent them an invitation, and you can chat once they set up their account.");
        return;
    }

    try {
        const chatId = await createConversation([targetId], false);
        
        if (chatId) {
            setActiveConversationId(chatId);
            fetchMessages(chatId);
            
            setShowNewChatModal(false);
            setShowMobileList(false);

            // Send pending message
            if (inputText) {
                await sendMessage(chatId, inputText);
                setInputText('');
            }
        } else {
            alert("Failed to start conversation. Please check your connection and try again.");
        }
    } catch (e: any) {
        console.error("Start chat error:", e);
        alert("Error starting chat: " + (e.message || "Unknown error"));
    }
  };

  const createGroupChat = async () => {
      if (!newGroupName.trim() || selectedGroupMembers.length === 0) return;

      try {
          const chatId = await createConversation(selectedGroupMembers, true, newGroupName);

          if (chatId) {
              setActiveConversationId(chatId);
              fetchMessages(chatId);
              
              setShowGroupModal(false);
              setShowMobileList(false);
              setNewGroupName('');
              setSelectedGroupMembers([]);
          } else {
              alert("Failed to create group chat.");
          }
      } catch (e: any) {
          console.error("Group chat error:", e);
          alert("Error creating group: " + (e.message || "Unknown error"));
      }
  };

  const toggleGroupMember = (userId: string | null | undefined) => {
      if (!userId) {
          alert("This user hasn't joined the portal yet. You can only add them to a group once they have set up their account.");
          return;
      }
      setSelectedGroupMembers(prev => 
          prev.includes(userId) ? prev.filter(m => m !== userId) : [...prev, userId]
      );
  };

  const deleteConversation = async (id: string) => {
    if (confirm("Delete this conversation history?")) {
      try {
        await dbDeleteConversation(id);
        if (activeConversationId === id) setActiveConversationId(null);
        setShowChatActions(false);
      } catch (err) {
        console.error("Error deleting conversation:", err);
        alert("Failed to delete conversation.");
      }
    }
  };

  const deleteCategory = (category: string) => {
    if (confirm(`Delete category "${category}"? Conversations will be moved to "All".`)) {
      const updated = customCategories.filter(c => c !== category);
      setCustomCategories(updated);
      localStorage.setItem('agencyos_chat_categories', JSON.stringify(updated));
      
      // Clean up conversation mappings
      const updatedConvCats = { ...conversationCategories };
      Object.keys(updatedConvCats).forEach(id => {
        if (updatedConvCats[id] === category) delete updatedConvCats[id];
      });
      setConversationCategories(updatedConvCats);
      localStorage.setItem('agencyos_conv_categories', JSON.stringify(updatedConvCats));
      
      if (activeCategory === category) setActiveCategory('All');
    }
  };

  const toggleMute = () => {
      if (!activeConversationId) return;
      const updatedConversations = conversations.map(c => 
          c.id === activeConversationId ? { ...c, isMuted: !c.isMuted } : c
      );
      
      // Update localStorage for App.tsx to read
      const mutedIds = updatedConversations.filter(c => c.isMuted).map(c => c.id);
      localStorage.setItem('agencyos_muted_chats', JSON.stringify(mutedIds));
      
      setConversations(updatedConversations);
      setShowChatActions(false);
  };

  const moveConversationToCategory = (convId: string, category: string) => {
    const updated = { ...conversationCategories, [convId]: category };
    setConversationCategories(updated);
    localStorage.setItem('agencyos_conv_categories', JSON.stringify(updated));
    setShowChatActions(false);
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          handleSendMessage('Voice Message', 'file', url, 'voice_message.webm', audioBlob.size);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Group Settings Handlers
  const handleUpdateGroup = async () => {
    if (!activeConversationId) return;
    try {
      await updateConversation(activeConversationId, {
        name: editGroupName,
        group_detail: editGroupDesc,
        category: editGroupCategory,
      });
      setShowGroupSettings(false);
    } catch (err) {
      console.error("Error updating group:", err);
      alert("Failed to update group.");
    }
  };

  const goToProfile = () => {
      if (activeChat && !activeChat.isGroup) {
          navigate(`/profile/${activeChat.participantId}`);
      }
      setShowDetails(false);
  };

  // Mark messages as read when conversation is active
  useEffect(() => {
    if (activeConversationId && dbMessages[activeConversationId]) {
      const unread = dbMessages[activeConversationId].filter(m => m.sender_id !== currentUser?.uid && m.status !== 'read');
      unread.forEach(m => updateMessageStatus(m.id, 'read'));
    }
  }, [activeConversationId, dbMessages, currentUser, updateMessageStatus]);

  const activeChat = conversations.find(c => c.id === activeConversationId);
  const typingUsersInConversation = typingUsers[activeConversationId] || [];
  const otherTypingUsers = typingUsersInConversation.filter(id => id !== currentUser?.uid);
  const isTyping = activeConversationId && otherTypingUsers.length > 0;
  const typingText = isTyping ? `${getMemberInfo(otherTypingUsers[0]).name} is typing...` : '';
  
  const filteredConversations = conversations
    .filter(c => {
      const matchesSearch = c.participantName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === 'All') return true;
      if (activeCategory === 'Clients') return c.participantType === 'Client' && !c.isGroup;
      if (activeCategory === 'Teams') return c.participantType === 'Team' && !c.isGroup;
      if (activeCategory === 'Groups') return c.isGroup;
      
      return conversationCategories[c.id] === activeCategory;
    })
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (msg: Message) => {
     if (msg.type === 'invite' && msg.payload) {
         return (
             <div className="w-72 bg-[#18181b] border border-blue-900/30 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-blue-500/50 group/card">
                <div className="h-20 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-black relative">
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                   <div className="absolute top-4 left-4">
                      <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg"><Rocket size={16} /></div>
                   </div>
                </div>
                <div className="p-5">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Secure Protocol</p>
                   <h4 className="text-base font-black text-white mb-2 leading-tight">{msg.payload.flowName || 'Onboarding Flow'}</h4>
                   <p className="text-xs text-zinc-400 mb-6 font-medium">You have been invited to complete the secure onboarding process.</p>
                   
                   <a 
                     href={msg.payload.url} 
                     target="_blank" 
                     className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest text-center shadow-lg transition-all flex items-center justify-center gap-2"
                   >
                      Begin Protocol <ArrowUpRight size={12} />
                   </a>
                </div>
             </div>
         );
     }
     
     if (msg.type === 'text') return <p>{msg.text}</p>;
     
     if (msg.type === 'image') return <img src={msg.fileUrl} alt="Attachment" className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewFile(msg)} />;
     
     if (msg.type === 'file') return (
       <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${msg.senderId === 'current' ? 'bg-blue-700' : 'bg-slate-100 dark:bg-zinc-900'}`} onClick={() => setPreviewFile(msg)}>
          <div className={`p-2 rounded-lg ${msg.senderId === 'current' ? 'bg-white/10' : 'bg-white dark:bg-zinc-800 text-slate-500'}`}><FileText size={20} /></div>
          <div className="text-xs"><p className="font-bold">{msg.fileName}</p><p className="opacity-70">{msg.fileSize ? (msg.fileSize < 1024 ? msg.fileSize + ' B' : Math.round(msg.fileSize/1024) + ' KB') : 'Attachment'}</p></div>
       </div>
     );
  };
  
  const renderPreviewContent = (msg: Message) => {
    if (!msg.fileUrl) return null;
    const ext = msg.fileName?.split('.').pop()?.toLowerCase() || 'unknown';

    if (['jpg', 'png', 'svg', 'jpeg', 'webp', 'gif'].includes(ext) || msg.type === 'image') {
       return <img src={msg.fileUrl} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" alt={msg.fileName} />;
    }
    
    if (['mp4', 'webm', 'mov'].includes(ext)) {
       return (
         <video controls className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl bg-black">
           <source src={msg.fileUrl} />
           Your browser does not support the video tag.
         </video>
       );
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return (
            <div className="bg-zinc-900 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-2xl">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center animate-pulse">
                    <Music size={40} className="text-white"/>
                </div>
                <audio controls src={msg.fileUrl} className="w-full min-w-[300px]" />
                <p className="text-white font-bold">{msg.fileName}</p>
            </div>
        );
    }

    if (ext === 'pdf') {
       return (
          <iframe src={msg.fileUrl} className="w-full h-[80vh] rounded-2xl shadow-2xl bg-white" title={msg.fileName} />
       );
    }

    return (
       <div className="bg-zinc-900 p-16 rounded-[3rem] text-center max-w-md shadow-2xl">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText size={40} className="text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{msg.fileName}</h3>
          <p className="text-zinc-500 mb-8">Preview not available for this file type.</p>
          <a href={msg.fileUrl} download={msg.fileName} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
             <Download size={16}/> Download File
          </a>
       </div>
    );
  };


  return (
    <div className="h-[calc(100vh-140px)] max-w-[1800px] mx-auto bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex animate-in fade-in duration-500 relative">
      
      {dbError && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-rose-600 text-white p-4 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4">
            <ShieldAlert size={16} />
            {dbError}
            <button onClick={() => alert("Please run the SQL schema provided in the chat to setup the database.")} className="px-4 py-1 bg-white text-rose-600 rounded-lg hover:bg-white/90">View Instructions</button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`w-full md:w-[380px] bg-slate-50 dark:bg-black/40 border-r border-slate-200 dark:border-zinc-800 flex flex-col ${!showMobileList ? 'hidden md:flex' : 'flex'}`}>
         
         <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Messages</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowGroupModal(true)} className="p-3 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 rounded-xl hover:text-blue-500 hover:border-blue-500 transition-all"><Users size={20} /></button>
                <button onClick={() => setShowNewChatModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"><Plus size={20} /></button>
              </div>
           </div>
           <div className="relative group mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white"/>
           </div>

           {/* Categories Tabs */}
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Clients', 'Teams', 'Groups'].map(cat => (
                <div key={cat} className="relative group/cat">
                  <button 
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                  >
                    {cat}
                  </button>
                </div>
              ))}
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredConversations.map(conv => (
               <div key={conv.id} onClick={() => handleSelectConversation(conv.id)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeConversationId === conv.id ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-lg' : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                  <div className="flex gap-4">
                     <div className="relative"><img src={conv.participantAvatar} className="w-12 h-12 rounded-xl object-cover" alt=""/>{conv.isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full" />}</div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                           <div className="flex flex-col min-w-0">
                             <div className="flex items-center gap-2">
                               <h4 className={`text-sm font-bold truncate ${activeConversationId === conv.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>{conv.participantName}</h4>
                               {activeCategory === 'All' && conversationCategories[conv.id] && (
                                 <span className="text-[8px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">{conversationCategories[conv.id]}</span>
                               )}
                             </div>
                             <div className="flex items-center gap-1.5 mt-0.5">
                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                 getMemberInfo(conv.participantId).type === 'Client' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                                 getMemberInfo(conv.participantId).role === 'Owner' || getMemberInfo(conv.participantId).role === 'Admin' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' :
                                 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                               }`}>
                                 {getMemberInfo(conv.participantId).role === 'Owner' || getMemberInfo(conv.participantId).role === 'Admin' ? getMemberInfo(conv.participantId).role : getMemberInfo(conv.participantId).type}
                               </span>
                             </div>
                           </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600">{formatTime(conv.lastMessageTime)}</span>
                          <div className="flex items-center gap-1.5">
                            {conv.isMuted && <BellOff size={10} className="text-slate-400" />}
                            {activeCategory === 'All' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowChatActions(true); setActiveConversationId(conv.id); }}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md text-slate-400 opacity-0 group-hover/conv:opacity-100 transition-opacity"
                              >
                                <FolderPlus size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs truncate text-slate-500 dark:text-zinc-500 flex-1">
                            {typingUsers[conv.id]?.filter(id => id !== currentUser?.uid).length > 0 ? (
                              <span className="text-blue-500 font-bold animate-pulse">Typing...</span>
                            ) : (
                              conv.lastMessage
                            )}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full min-w-[18px] text-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Main Chat Window */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#0c0c0e] relative ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
         {activeChat ? (
           <>
             {/* Header */}
             <div className="h-20 px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                   <button onClick={() => setShowMobileList(true)} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-zinc-400"><ArrowLeft size={20}/></button>
                   <div className="relative cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                      <img src={activeChat.participantAvatar} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-zinc-800 shadow-sm" />
                      {activeChat.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-black rounded-full" />}
                   </div>
                   <div className="cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                         {activeChat.participantName}
                         <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${activeChat.isGroup ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>{activeChat.participantRole}</span>
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                        {isTyping ? (
                          <span className="text-blue-500 animate-pulse">{typingText}</span>
                        ) : (
                          activeChat.isOnline ? 'Online now' : 'Offline'
                        )}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   {activeChat.isGroup && (
                     <button onClick={() => {
                       setEditGroupName(activeChat.participantName);
                       setEditGroupDesc(activeChat.group_detail || '');
                       setEditGroupCategory(activeChat.category || '');
                       setShowGroupSettings(true);
                     }} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"><Settings size={18} /></button>
                   )}
                   <button onClick={() => setShowDetails(!showDetails)} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"><Info size={18} /></button>
                   <div className="relative" ref={actionsRef}>
                      <button onClick={() => setShowChatActions(!showChatActions)} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500"><MoreVertical size={18} /></button>
                      {showChatActions && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20"><p className="text-[10px] font-black uppercase text-slate-400">Actions</p></div>
                            <button 
                               onClick={() => setShowOnboardingPicker(true)}
                               className="w-full px-4 py-3 text-left text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-between"
                             >
                               Send Onboarding Form
                               <Rocket size={14}/>
                             </button>
                            <button onClick={toggleMute} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between">
                              {activeChat.isMuted ? 'Unmute' : 'Mute'}
                              {activeChat.isMuted ? <Bell size={14}/> : <BellOff size={14}/>}
                            </button>
                            
                            <div className="px-4 py-2 border-b border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20"><p className="text-[10px] font-black uppercase text-slate-400">Move to Category</p></div>
                            {['All', 'Clients', 'Teams', ...customCategories].map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => moveConversationToCategory(activeChat.id, cat)}
                                className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                              >
                                {cat}
                                {conversationCategories[activeChat.id] === cat && <Check size={12} className="text-blue-500"/>}
                              </button>
                            ))}

                            <div className="border-t border-slate-100 dark:border-zinc-800">
                              <button onClick={() => deleteConversation(activeChat.id)} className="w-full px-4 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center justify-between">
                                Delete Chat
                                <Trash2 size={14}/>
                               </button>
                            </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Messages */}
             <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
                {activeChat.messages.map((msg, i) => {
                   const isMe = msg.senderId === 'current';
                   return (
                     <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[75%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                           {!isMe && (
                             <div className="flex flex-col items-center self-end mb-1">
                               <img src={getMemberInfo(msg.senderId).avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                               {activeChat.isGroup && <span className="text-[8px] font-bold text-slate-400 mt-0.5 truncate max-w-[40px]">{getMemberInfo(msg.senderId).name.split(' ')[0]}</span>}
                             </div>
                           )}
                           <div className={`space-y-1 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`
                                 ${msg.type === 'invite' ? '' : `p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm relative overflow-hidden`}
                                 ${msg.type !== 'invite' && isMe ? 'bg-blue-600 text-white rounded-br-none' : ''}
                                 ${msg.type !== 'invite' && !isMe ? 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-100 dark:border-zinc-700 rounded-bl-none' : ''}
                              `}>
                                 {renderMessageContent(msg)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 {isMe && (
                                   <div className="flex items-center">
                                     {msg.status === 'sent' && <Check size={12} className="text-slate-400" />}
                                     {msg.status === 'delivered' && (
                                       <div className="flex -space-x-1">
                                         <Check size={12} className="text-slate-400" />
                                         <Check size={12} className="text-slate-400" />
                                       </div>
                                     )}
                                     {msg.status === 'read' && (
                                       <div className="flex -space-x-1">
                                         <Check size={12} className="text-blue-500" />
                                         <Check size={12} className="text-blue-500" />
                                       </div>
                                     )}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Input */}
             <div className="p-6 bg-white dark:bg-[#0c0c0e] border-t border-slate-100 dark:border-zinc-800 z-20">
                <div className="flex items-end gap-3 bg-slate-50 dark:bg-zinc-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all">
                   <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-all shrink-0"><Plus size={20} strokeWidth={2.5} /></button>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                   
                   {isRecording ? (
                     <div className="flex-1 flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                           <span className="text-xs font-black text-rose-600 tracking-widest uppercase">Recording... {formatDuration(recordingDuration)}</span>
                        </div>
                        <button onClick={stopRecording} className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all"><Square size={16} fill="currentColor" /></button>
                     </div>
                   ) : (
                     <textarea 
                        value={inputText}
                        onChange={e => {
                          setInputText(e.target.value);
                          if (activeConversationId) {
                            // Only send typing status if it's not already true to avoid spam
                            if (!(window as any).isCurrentlyTyping) {
                              (window as any).isCurrentlyTyping = true;
                              sendTypingStatus(activeConversationId, true);
                            }
                            
                            clearTimeout((window as any).typingTimeout);
                            (window as any).typingTimeout = setTimeout(() => {
                              (window as any).isCurrentlyTyping = false;
                              sendTypingStatus(activeConversationId, false);
                            }, 3000);
                          }
                        }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-none outline-none max-h-32 min-h-[44px] py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                        rows={1}
                     />
                   )}

                   <div className="flex items-center gap-1 pb-1 relative">
                      {!isRecording && (
                        <>
                          <button onClick={startRecording} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-all"><Mic size={20}/></button>
                          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full"><Smile size={20}/></button>
                        </>
                      )}
                      {showEmojiPicker && (
                         <div ref={emojiRef} className="absolute bottom-full right-0 mb-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl w-64 h-64 flex flex-col overflow-hidden z-50">
                            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 gap-1 content-start custom-scrollbar">
                                {EMOJI_CATEGORIES[emojiCategory].emojis.map(e => (
                                    <button key={e} onClick={() => handleEmojiClick(e)} className="text-xl p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded">{e}</button>
                                ))}
                            </div>
                         </div>
                      )}
                      {!isRecording && (
                        <button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"><Send size={18} fill="currentColor" className="ml-0.5" /></button>
                      )}
                   </div>
                </div>
             </div>
           </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
               <MessageSquare size={64} className="text-slate-300 dark:text-zinc-700 mb-4" strokeWidth={1.5} />
               <h3 className="text-2xl font-black text-slate-900 dark:text-white">Secure Messenger</h3>
               <button onClick={() => setShowNewChatModal(true)} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">Start Chat</button>
            </div>
         )}
      </div>
      
      {/* Details Sidebar */}
      {showDetails && activeChat && (
        <div className="w-[350px] bg-slate-50 dark:bg-black/40 border-l border-slate-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300">
           <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Details</h3>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400"><X size={18}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 flex flex-col items-center text-center border-b border-slate-200 dark:border-zinc-800">
                 <img src={activeChat.participantAvatar} className="w-24 h-24 rounded-[2rem] object-cover shadow-2xl mb-4" alt=""/>
                 <h4 className="text-lg font-black text-slate-900 dark:text-white">{activeChat.participantName}</h4>
                 <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">{activeChat.participantRole}</p>
                 {activeChat.isGroup && activeChat.group_detail && (
                   <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4 max-w-[200px] line-clamp-3">{activeChat.group_detail}</p>
                 )}
                 <div className="flex gap-2">
                 </div>
              </div>
              
              <div className="p-6 space-y-6">
                 {activeChat.isGroup && (
                   <div>
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Members</h5>
                        <button onClick={() => {
                          setEditGroupName(activeChat.participantName);
                          setEditGroupDesc(activeChat.group_detail || '');
                          setEditGroupCategory(activeChat.category || '');
                          setShowGroupSettings(true);
                        }} className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest">Manage</button>
                      </div>
                      <div className="space-y-4">
                        {/* Admin Section */}
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Admins</p>
                          <div className="space-y-2">
                            {dbConversations.find(c => c.id === activeChat.id)?.participants.filter((p: any) => p.role === 'admin' || p.role === 'owner').map((p: any) => {
                              const info = getMemberInfo(p.user_id);
                              return (
                                <div key={p.user_id} className="flex items-center gap-3">
                                  <img src={info.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{info.name}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{p.role}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Team Section */}
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Team</p>
                          <div className="space-y-2">
                            {dbConversations.find(c => c.id === activeChat.id)?.participants.filter((p: any) => p.role !== 'admin' && p.role !== 'owner' && getMemberInfo(p.user_id).type === 'Team').map((p: any) => {
                              const info = getMemberInfo(p.user_id);
                              return (
                                <div key={p.user_id} className="flex items-center gap-3">
                                  <img src={info.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{info.name}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{info.role}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Clients Section */}
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Clients</p>
                          <div className="space-y-2">
                            {dbConversations.find(c => c.id === activeChat.id)?.participants.filter((p: any) => p.role !== 'admin' && p.role !== 'owner' && getMemberInfo(p.user_id).type === 'Client').map((p: any) => {
                              const info = getMemberInfo(p.user_id);
                              return (
                                <div key={p.user_id} className="flex items-center gap-3">
                                  <img src={info.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{info.name}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{info.role}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                   </div>
                 )}
                 <div>
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4">Settings</h5>
                    <div className="space-y-2">
                       <button onClick={toggleMute} className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-lg text-slate-500"><BellOff size={16}/></div>
                             <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Mute Notifications</span>
                          </div>
                          <div className={`w-8 h-4 rounded-full relative transition-all ${activeChat.isMuted ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                             <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeChat.isMuted ? 'right-0.5' : 'left-0.5'}`} />
                          </div>
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4">Shared Media</h5>
                    <div className="grid grid-cols-3 gap-2">
                       {activeChat.messages.filter(m => m.type === 'image').slice(0, 6).map(m => (
                          <img key={m.id} src={m.fileUrl} className="aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80 transition-all" alt="" onClick={() => setPreviewFile(m)} />
                       ))}
                       {activeChat.messages.filter(m => m.type === 'image').length === 0 && (
                          <p className="col-span-3 text-[10px] text-slate-400 dark:text-zinc-600 italic">No shared media yet</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Onboarding Picker Modal */}
      {showOnboardingPicker && (
        <div className="fixed inset-0 z-[10005] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Select Protocol</h3>
              <button onClick={() => setShowOnboardingPicker(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400"><X size={20}/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {onboardingFlows.filter(f => f.status === 'Live').map(flow => (
                <button 
                  key={flow.id} 
                  onClick={() => handleSendOnboardingInvite(flow)}
                  className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl border border-transparent hover:border-blue-500/30 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600">{flow.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{flow.steps?.length || 0} Steps • {flow.responses} Responses</p>
                  </div>
                  <Send size={16} className="text-slate-300 group-hover:text-blue-500" />
                </button>
              ))}
              {onboardingFlows.filter(f => f.status === 'Live').length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Rocket size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Live Protocols Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewChatModal && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">New Conversation</h3>
                  <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
               </div>
               <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20">
                  <input autoFocus className="w-full bg-transparent outline-none font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Search people..." onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  <div className="px-4 py-2 flex items-center gap-2"><Building2 size={12} className="text-blue-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Clients</p></div>
                  {clientList.filter(c => (c.name || c.company || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                     <button 
                        key={c.id} 
                        onClick={() => startNewChat(c, 'Client')} 
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${c.userId ? 'hover:bg-slate-50 dark:hover:bg-zinc-900' : 'opacity-70 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50'}`}
                     >
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <img src={c.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all" alt=""/>
                              {!c.userId && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-black rounded-full" />}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name || c.company || 'Unknown Client'}</p>
                              <p className="text-xs text-slate-500 dark:text-zinc-500">{c.company}</p>
                           </div>
                        </div>
                        {!c.userId && (
                           <span className="text-[8px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Not Joined</span>
                        )}
                     </button>
                  ))}
                  <div className="px-4 py-2 flex items-center gap-2 mt-4"><Users size={12} className="text-emerald-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Team</p></div>
                  {teamMembers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                     <button 
                        key={p.id} 
                        onClick={() => startNewChat(p, 'Team')} 
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${p.userId ? 'hover:bg-slate-50 dark:hover:bg-zinc-900' : 'opacity-70 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50'}`}
                     >
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <img src={p.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-emerald-500 transition-all" alt=""/>
                              {!p.userId && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-black rounded-full" />}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-500 dark:text-zinc-500">{p.role}</p>
                           </div>
                        </div>
                        {!p.userId && (
                           <span className="text-[8px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Not Joined</span>
                        )}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {showGroupModal && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Create Group Chat</h3>
                  <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 block">Group Name</label>
                     <input 
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white"
                        placeholder="Enter group name..."
                     />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 block">Select Members ({selectedGroupMembers.length})</label>
                     <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                        <div className="px-3 py-1 text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Team</div>
                        {teamMembers.map(p => (
                           <button 
                              key={p.id} 
                              onClick={() => toggleGroupMember(p.userId)}
                              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left border ${p.userId && selectedGroupMembers.includes(p.userId) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'} ${!p.userId ? 'opacity-70' : ''}`}
                           >
                              <div className="relative">
                                 <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt=""/>
                                 {!p.userId && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-black rounded-full" />}
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                                 <p className="text-xs text-slate-500 dark:text-zinc-500">{p.role}</p>
                              </div>
                              {p.userId && selectedGroupMembers.includes(p.userId) && <CheckCircle2 className="text-blue-500" size={20} />}
                              {!p.userId && <span className="text-[8px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Not Joined</span>}
                           </button>
                        ))}
                        <div className="px-3 py-1 text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-2">Clients</div>
                        {clientList.map(c => (
                           <button 
                              key={c.id} 
                              onClick={() => toggleGroupMember(c.userId)}
                              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left border ${c.userId && selectedGroupMembers.includes(c.userId) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'} ${!c.userId ? 'opacity-70' : ''}`}
                           >
                              <div className="relative">
                                 <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt=""/>
                                 {!c.userId && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-black rounded-full" />}
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name || c.company || 'Unknown Client'}</p>
                                 <p className="text-xs text-slate-500 dark:text-zinc-500">{c.company}</p>
                              </div>
                              {c.userId && selectedGroupMembers.includes(c.userId) && <CheckCircle2 className="text-blue-500" size={20} />}
                              {!c.userId && <span className="text-[8px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Not Joined</span>}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-slate-100 dark:border-zinc-800">
                  <button 
                     onClick={createGroupChat}
                     disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                     Create Group
                  </button>
               </div>
            </div>
         </div>
      )}

      {showGroupSettings && activeChat && (
         <div className="fixed inset-0 z-[1000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Group Settings</h3>
                  <button onClick={() => setShowGroupSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  <div className="flex flex-col items-center gap-4">
                     <div className="relative group">
                        <img src={activeChat.participantAvatar} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl" alt=""/>
                        <input 
                          type="file" 
                          id="group-logo-upload" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !activeChat) return;

                            try {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const base64String = reader.result as string;
                                
                                const { error: updateError } = await supabase
                                  .from('conversations')
                                  .update({ logo: base64String })
                                  .eq('id', activeChat.id);

                                if (updateError) throw updateError;

                                fetchConversations();
                                alert("Group logo updated successfully!");
                              };
                              reader.readAsDataURL(file);
                            } catch (error) {
                              console.error("Error uploading logo:", error);
                              alert("Failed to update group logo.");
                            }
                          }} 
                        />
                        <button 
                          onClick={() => document.getElementById('group-logo-upload')?.click()}
                          className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                        >
                          <Camera size={24}/>
                        </button>
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Change Group Logo</p>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 block">Group Name</label>
                        <input 
                           value={editGroupName}
                           onChange={e => setEditGroupName(e.target.value)}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 block">Description</label>
                        <textarea 
                           value={editGroupDesc}
                           onChange={e => setEditGroupDesc(e.target.value)}
                           placeholder="What's this group about?"
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white resize-none"
                           rows={3}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 mb-2 block">Category</label>
                        <input 
                           value={editGroupCategory}
                           onChange={e => setEditGroupCategory(e.target.value)}
                           placeholder="e.g. VIP Clients"
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white"
                        />
                     </div>
                  </div>

                  <div>
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Members</h4>
                        <button 
                          onClick={() => {
                            setShowGroupSettings(false);
                            setShowGroupModal(true);
                            setNewGroupName(activeChat.participantName);
                            // Pre-select existing members
                            const existingIds = dbConversations.find(c => c.id === activeChat.id)?.participants.map((p: any) => p.user_id) || [];
                            setSelectedGroupMembers(existingIds);
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          <UserPlus size={12}/> Add Member
                        </button>
                     </div>
                     <div className="space-y-2">
                        {/* Resolve members from conversation participants */}
                        {dbConversations.find(c => c.id === activeChat.id)?.participants.map((p: any) => {
                           const info = getMemberInfo(p.user_id);
                           const isOnline = onlineUsers.has(p.user_id);
                           return (
                              <div key={p.user_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                                 <div className="flex items-center gap-3">
                                    <div className="relative">
                                       <img src={info.avatar} className="w-8 h-8 rounded-lg object-cover" alt=""/>
                                       {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full" />}
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-900 dark:text-white">{info.name}</p>
                                       <div className="flex items-center gap-2">
                                          <p className="text-[10px] text-slate-500">{isOnline ? 'Online' : 'Offline'}</p>
                                          {activeChat.messages.length > 0 && activeChat.messages[activeChat.messages.length - 1].senderId !== p.user_id && (
                                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-0.5">
                                                <Check size={8}/> Seen
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                 <button className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-slate-100 dark:border-zinc-800">
                  <button 
                     onClick={handleUpdateGroup}
                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all"
                  >
                     Save Changes
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in" onClick={() => setPreviewFile(null)}>
             <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                {renderPreviewContent(previewFile)}
                <button onClick={() => setPreviewFile(null)} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/5">Close Preview</button>
             </div>
          </div>
      )}

    </div>
  );
};

export default Inbox;
