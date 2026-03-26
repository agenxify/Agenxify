
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, LayoutTemplate, RefreshCw, AlertCircle, Loader2,
  CheckCircle2, MapPin, Calendar, Clock, Download, ExternalLink,
  Mail, Phone, Star, ShoppingCart, Play, ChevronLeft, ChevronRight,
  Quote, Shield, Globe, Zap, Info, ShieldCheck, Lock
} from 'lucide-react';
import { Page, PageBlock } from '../types';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

// --- Helper Components for Public View ---

const PublicCarousel = ({ items }: { items: string[] }) => {
  const [index, setIndex] = useState(0);
  if (!items || items.length === 0) return null;

  const next = () => setIndex((prev) => (prev + 1) % items.length);
  const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div className="w-full aspect-video md:h-96 bg-black rounded-2xl overflow-hidden relative group">
        <img src={items[index]} className="w-full h-full object-cover transition-opacity duration-500" alt="" />
        {items.length > 1 && (
            <>
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prev} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"><ChevronLeft size={24}/></button>
                    <button onClick={next} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"><ChevronRight size={24}/></button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {items.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`} />
                    ))}
                </div>
            </>
        )}
    </div>
  );
};

const ReadOnlyBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
  const p = block.properties || {};
  
  // Construct style object from properties
  const style: React.CSSProperties = {
    textAlign: p.align as any || 'left',
    color: p.color,
    backgroundColor: p.backgroundColor,
    fontSize: p.fontSize,
    fontFamily: p.fontFamily,
    fontWeight: p.fontWeight,
    fontStyle: p.isItalic ? 'italic' : 'normal',
    textDecoration: p.isUnderline ? 'underline' : 'none',
    lineHeight: p.lineHeight,
    padding: p.padding ? `${p.padding}px` : undefined,
    margin: p.margin ? `${p.margin}px` : undefined,
    borderRadius: p.borderRadius ? `${p.borderRadius}px` : undefined,
    borderWidth: p.borderWidth,
    borderStyle: p.borderStyle,
    borderColor: p.borderColor,
    width: p.width,
    height: p.height
  };

  const containerClass = `w-full relative ${p.hideOnMobile ? 'hidden sm:block' : ''}`;

  switch (block.type) {
    case 'heading':
      return (
        <div className={containerClass}>
          {p.heading === 'h1' ? (
            <h1 style={{ ...style, fontSize: style.fontSize || '3rem', fontWeight: style.fontWeight || '900', lineHeight: 1.1 }}>{block.content}</h1>
          ) : (
            <h2 style={{ ...style, fontSize: style.fontSize || '2rem', fontWeight: style.fontWeight || '700' }}>{block.content}</h2>
          )}
        </div>
      );

    case 'text':
      return (
        <div className={containerClass}>
           <p style={{ ...style, whiteSpace: 'pre-wrap' }}>{block.content}</p>
        </div>
      );

    case 'button':
      return (
        <div className={containerClass} style={{ marginTop: p.bannerSpacing ? `${p.bannerSpacing}px` : undefined, marginBottom: p.bannerSpacing ? `${p.bannerSpacing}px` : undefined }}>
           <div style={{ display: 'flex', justifyContent: p.align || 'flex-start' }}>
              <a 
                href={p.url || '#'} 
                target={p.openInNewTab ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                style={{
                    backgroundColor: p.buttonColor || '#2563eb',
                    color: p.textColor || '#ffffff',
                    padding: '12px 32px',
                    borderRadius: p.borderRadius ? `${p.borderRadius}px` : '999px',
                    border: `${p.borderWidth || '0px'} ${p.borderStyle || 'solid'} ${p.borderColor || 'transparent'}`,
                    fontWeight: 'bold',
                    fontSize: p.fontSize ? `${p.fontSize}px` : '14px',
                    fontFamily: p.fontFamily,
                    width: p.customize ? p.width : 'auto',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                    textDecoration: 'none'
                }}
              >
                 {p.buttonText || 'Button'}
              </a>
           </div>
        </div>
      );

    case 'image':
      return (
        <div className={`${containerClass} flex`} style={{ justifyContent: p.align || 'center' }}>
           {block.content && <img src={block.content} alt="" style={{ borderRadius: style.borderRadius || '16px', maxWidth: '100%', objectFit: 'cover' }} />}
        </div>
      );

    case 'video':
      return (
        <div className={containerClass}>
           {block.content ? (
             <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe 
                  src={block.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} 
                  className="w-full h-full" 
                  allowFullScreen 
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                />
             </div>
           ) : null}
        </div>
      );

    case 'carousel': {
      let slides = [];
      try { slides = JSON.parse(block.content); } catch(e) { /* ignore */ }
      return (
        <div className={containerClass}>
           <PublicCarousel items={slides} />
        </div>
      );
    }

    case 'divider':
      return (
        <div className={containerClass} style={{ padding: '20px 0' }}>
            <div style={{
                height: p.width ? `${p.width}px` : '1px',
                backgroundColor: p.style === 'Solid' ? (p.color || '#27272a') : 'transparent',
                borderTop: p.style !== 'Solid' ? `${p.width || 1}px ${p.style?.toLowerCase() || 'solid'} ${p.color || '#27272a'}` : undefined,
                width: '100%'
            }} />
        </div>
      );

    case 'spacer':
    case 'newline':
      return <div style={{ height: `${block.content || 24}px`, width: '100%' }} />;

    case 'table': {
      let tableData = [['']];
      try { tableData = JSON.parse(block.content); } catch(e) { /* ignore */ }
      return (
        <div className={`${containerClass} overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800`}>
           <table className="w-full border-collapse text-sm text-left">
              <tbody>
                 {tableData.map((row: string[], i: number) => (
                    <tr key={i}>
                       {row.map((cell, j) => (
                          <td key={j} className={`p-3 border border-zinc-200 dark:border-zinc-800 ${i===0 ? 'bg-zinc-50 dark:bg-zinc-900 font-bold' : ''}`}>
                             {cell}
                          </td>
                       ))}
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      );
    }
    case 'dynamic_table': {
      let tableData = { columns: [], rows: [] };
      try { tableData = JSON.parse(block.content); } catch(e) { /* ignore */ }
      return (
        <div className={`${containerClass} overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800`}>
           <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr>
                  {tableData.columns.map((col: any) => (
                    <th key={col.id} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                 {tableData.rows.map((row: any, i: number) => (
                    <tr key={row.id || i}>
                       {tableData.columns.map((col: any) => (
                          <td key={col.id} className="p-3 border border-zinc-200 dark:border-zinc-800">
                             {row[col.id]}
                          </td>
                       ))}
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      );
    }
    case 'emoji':
      return <div className={containerClass}>{block.content}</div>;

    case 'column': {
      let cols = [['']];
      try { cols = JSON.parse(block.content); } catch(e) { /* ignore */ }
      return (
        <div className={`${containerClass} grid grid-cols-1 md:grid-cols-${cols.length} gap-8`} style={{ padding: style.padding }}>
           {cols.map((col: string[], i: number) => (
              <div key={i} className="prose prose-sm dark:prose-invert max-w-none">
                 <p className="whitespace-pre-wrap">{col[0]}</p>
              </div>
           ))}
        </div>
      );
    }

    case 'embed':
      return (
        <div className={containerClass}>
           <div className="w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
               {block.content?.trim().startsWith('<iframe') ? (
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
               ) : (
                  <iframe src={block.content} className="w-full min-h-[500px]" frameBorder="0" />
               )}
           </div>
        </div>
      );

    case 'signature':
       return (
         <div className={containerClass}>
            <div className="border-t border-zinc-300 dark:border-zinc-700 pt-8 mt-8 max-w-xs mx-auto text-center">
               {p.mode === 'TYPE' ? (
                  <p className="text-4xl text-black dark:text-white mb-2" style={{ fontFamily: p.font || 'cursive' }}>{block.content}</p>
               ) : (
                  <img src={block.content} alt="Signature" className="h-20 mx-auto mb-2 object-contain" />
               )}
               <p className="text-sm font-bold text-zinc-900 dark:text-white">{p.name}</p>
               <p className="text-xs text-zinc-500">{p.email}</p>
               <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-1">
                  <ShieldCheck size={10} /> Verified {p.date}
               </div>
            </div>
         </div>
       );

    case 'banner': {
       const bannerColors: any = {
           success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
           warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
           error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
           info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
           neutral: 'bg-zinc-100 text-zinc-600 border-zinc-200'
       };
       return (
         <div className={`${containerClass} p-6 rounded-2xl border ${bannerColors[p.variant || 'info'] || bannerColors.info} flex items-start gap-4`}>
             <Info size={20} className="shrink-0 mt-0.5" />
             <p className="text-sm font-bold leading-relaxed">{block.content}</p>
         </div>
       );
    }
    
    case 'colorbox':
        return (
            <div className={containerClass} style={{ backgroundColor: p.backgroundColor || '#2563eb10', padding: `${p.padding || 40}px`, borderRadius: '24px' }}>
                <p style={{ ...style, margin: 0, padding: 0 }}>{block.content}</p>
            </div>
        );

    case 'quote':
        return (
            <div className={`${containerClass} text-center px-8 py-12`}>
                <Quote size={40} className="mx-auto mb-6 text-blue-500/30" />
                <p className="text-2xl md:text-3xl font-bold leading-tight mb-6" style={{ fontFamily: 'serif' }}>"{block.content}"</p>
                {p.author && <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">— {p.author}</p>}
            </div>
        );

    default:
      return null;
  }
};

const PageView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const pageId = location.pathname.split('/p/')[1].replace(/\/$/, "");
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const load = async () => {
        if (!pageId) return;
        setLoading(true);
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId);
            let query = supabase.from('pages').select('*');
            
            if (isUuid) {
                query = query.or(`id.eq.${pageId},slug.eq.${pageId}`);
            } else {
                query = query.eq('slug', pageId);
            }

            const { data, error } = await query.maybeSingle();

            if (data) {
                // Now check permission with the actual ID
                if (!userProfile?.isOwner) {
                    const allowedIds = userProfile?.allowedPageIds || [];
                    if (!allowedIds.includes(data.id)) {
                        setPermissionDenied(true);
                        setLoading(false);
                        return;
                    }
                }

                setPage({
                    ...data,
                    blocks: data.blocks || []
                });
                
                // Increment view count
                if (data.status === 'Published') {
                    supabase.rpc('increment_page_view', { page_id: data.id }).then(({ error }) => {
                        if(error) console.warn("Failed to increment view", error);
                    });
                }
            }
        } catch (e) {
            console.error("Error loading page:", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [pageId, user, userProfile, authLoading, navigate, location.pathname]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
    </div>
  );

  if (permissionDenied) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500">
                <Lock size={32} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Access Restricted</h2>
                <p className="text-zinc-500 font-bold text-sm">You do not have explicit authorization to view this protocol. Please contact your workspace administrator for access.</p>
            </div>
            <button 
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all"
            >
                Return to Dashboard
            </button>
        </div>
    </div>
  );

  if (!page) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                <LayoutTemplate size={24} />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Page Not Found</h2>
            <p className="text-zinc-500">This page may have been moved or deleted.</p>
        </div>
    </div>
  );

  // In the future, these can be loaded from page.settings if we add that to the DB schema
  // For now we use sensible defaults or try to infer from first block if it was a header/settings block
  const pageStyle: React.CSSProperties = {
      backgroundColor: page.settings?.backgroundColor || '#ffffff',
      minHeight: '100vh',
      color: page.settings?.textColor || '#18181b',
      backgroundImage: page.settings?.backgroundUrl ? `url(${page.settings.backgroundUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: page.settings?.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div style={pageStyle} className="font-sans antialiased overflow-x-hidden selection:bg-blue-200">
        <div className="mx-auto px-6 py-12 md:py-24 animate-in fade-in duration-700" style={{ maxWidth: page.settings?.maxWidth || 1000, padding: page.settings?.padding ? `${page.settings.padding}px` : undefined }}>
            {/* Page Title */}
            {page.title && page.title !== 'Untitled Page' && (
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{page.title}</h1>
                    <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full opacity-20" />
                </div>
            )}

            {/* Render Blocks */}
            <div className="space-y-6" style={{ lineHeight: page.settings?.lineSpacing || 1.5 }}>
                {page.blocks.map(block => (
                    <ReadOnlyBlock key={block.id} block={block} />
                ))}
            </div>

            {/* Footer */}
            <div className="mt-32 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    Powered by AgencyOS
                </div>
            </div>
        </div>
    </div>
  );
};

export default PageView;
