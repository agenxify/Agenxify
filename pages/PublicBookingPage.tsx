
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Globe, Clock, ArrowRight, CheckCircle2,
  Lock, Zap, Calendar as CalendarIcon, User, Mail, ShieldCheck, ArrowLeft,
  Loader2, ChevronDown, Video, ExternalLink, MapPin, Monitor, RefreshCw
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { useBookings } from '../hooks/useBookings.ts';
import { supabase } from '../supabase.ts';

const { useParams, useNavigate } = ReactRouterDom as any;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_TIMEZONES = (Intl as any).supportedValuesOf('timeZone');

// EmailJS Configuration
const EMAIL_CONFIG = {
  SERVICE_ID: 'service_eki14se',
  TEMPLATE_ID: 'template_tg5pymr',
  PUBLIC_KEY: 'SRove_ciDKhUF5QGu'
};

// Helper: Get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const PublicBookingPage: React.FC = () => {
  const { id: inviteId } = useParams();
  const navigate = useNavigate();
  
  // Use hook to fetch data
  const { eventTypes, bookings: dashboardBookings, addBooking, loading: bookingsLoading } = useBookings();
  
  const [bookingType, setBookingType] = useState<any>(null);
  const [publicBookings, setPublicBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const existingBookings = useMemo(() => {
    return dashboardBookings.length > 0 ? dashboardBookings : publicBookings;
  }, [dashboardBookings, publicBookings]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [step, setStep] = useState<'Date' | 'Intake' | 'Success'>('Date');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  
  // Protocol status for loading screen
  const [protocolStatus, setProtocolStatus] = useState("Initializing Handshake...");

  useEffect(() => {
    const loadBookingType = async () => {
      if (!inviteId) return;

      // Try to find in eventTypes first (if logged in)
      if (eventTypes.length > 0) {
        const found = eventTypes.find((t: any) => t.slug === inviteId || t.id === inviteId);
        if (found) {
          setBookingType(found);
          if (found.timezone && found.autoTimezone !== false) setSelectedTimezone(found.timezone);
          setLoading(false);
          return;
        }
      }

      // If not found or not logged in, fetch directly from Supabase
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .or(`slug.eq.${inviteId},id.eq.${inviteId}`)
          .single();

        if (error) throw error;
        if (data) {
          const formatted = {
            ...data,
            locationType: data.location_type,
            locationProvider: data.location_provider,
            intakeFields: data.intake_fields,
            location_url: data.location_url,
          };
          setBookingType(formatted);
          if (formatted.timezone && formatted.autoTimezone !== false) setSelectedTimezone(formatted.timezone);

          // Fetch bookings for this workspace to check for conflicts
          const { data: bData } = await supabase
            .from('bookings')
            .select('*')
            .eq('workspace_id', data.workspace_id);
          
          if (bData) {
            const formattedBookings = bData.map((b: any) => ({
                ...b,
                eventType: b.event_type_id,
                client: b.client_name,
                clientEmail: b.client_email,
                dueDate: b.due_date,
                dueTime: b.due_time,
                meetUrl: b.meet_url
            }));
            setPublicBookings(formattedBookings);
          }
        }
      } catch (err) {
        console.error('Error fetching booking type:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookingType();
  }, [inviteId, eventTypes]);

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const arr = [];
    
    // Fill padding (previous month days)
    const prevMonthEnd = new Date(year, month, 0).getDate();
    const startDay = start.getDay(); // 0 is Sun, 1 is Mon
    const padding = startDay === 0 ? 6 : startDay - 1; // Adjust to start with Monday
    
    for (let i = padding - 1; i >= 0; i--) {
      arr.push({ day: prevMonthEnd - i, currentMonth: false });
    }
    
    // Fill current month
    for (let i = 1; i <= end.getDate(); i++) {
      arr.push({ day: i, currentMonth: true });
    }

    // Fill padding (next month days)
    const totalSlots = 42; // 6 rows of 7
    const remaining = totalSlots - arr.length;
    for (let i = 1; i <= remaining; i++) {
        arr.push({ day: i, currentMonth: false });
    }
    
    return arr;
  }, [viewDate]);

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // Dynamic Time Slots Generation with Conflict Checking
  const availableTimeSlots = useMemo(() => {
    if (!bookingType) return [];
    
    const hoursConfig = bookingType.availability?.hours || {
        Monday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    };
    
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayConfig = hoursConfig[dayName];

    if (!dayConfig || !dayConfig.active) return [];

    const interval = bookingType.limits?.timeInterval || 30;
    const duration = bookingType.duration || 30;
    const slots: string[] = [];

    const selectedDateStr = getLocalDateString(selectedDate);

    const checkCollision = (slotStartMs: number, slotDurationMinutes: number) => {
        const slotEndMs = slotStartMs + (slotDurationMinutes * 60000);

        return existingBookings.some((b: any) => {
            if (b.dueDate !== selectedDateStr) return false;
            const existingStart = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
            const existingEnd = existingStart + (b.duration || 30) * 60000;
            return (slotStartMs < existingEnd) && (slotEndMs > existingStart);
        });
    };

    (dayConfig.slots || []).forEach((slot: any) => {
        if (!slot.start || !slot.end) return;
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);
        
        const current = new Date(selectedDate);
        current.setHours(startH, startM, 0, 0);
        
        const end = new Date(selectedDate);
        end.setHours(endH, endM, 0, 0);

        while (current < end) {
            const slotEnd = new Date(current.getTime() + duration * 60000);
            if (slotEnd > end) break;
            
            if (!checkCollision(current.getTime(), duration)) {
                slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
            }
            current.setMinutes(current.getMinutes() + interval);
        }
    });

    return slots;
  }, [bookingType, selectedDate, existingBookings]);

  // Robust Email Sending Function
  const sendBookingEmail = async (toEmail: string, name: string, date: string, time: string, details: Record<string, string>, type: any, ctaText: string, ctaLink: string, extraDetailsHtml: string) => {
    try {
        console.log("Attempting to send email to:", toEmail);
        
        // Construct a beautiful HTML email template
        const intakeDetailsHtml = Object.entries(details)
            .map(([key, value]) => `
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">${key}</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #e2e8f0;">${value}</p>
                </div>
            `).join('');

        const emailHtml = `
            <div style="background-color: #09090b; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #0c0f17; border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Header -->
                    <div style="padding: 40px; text-align: center; background: linear-gradient(to bottom, rgba(37, 99, 235, 0.1), transparent);">
                        <div style="display: inline-block; width: 64px; height: 64px; background: #2563eb; border-radius: 20px; margin-bottom: 24px; line-height: 64px; text-align: center;">
                            <span style="font-size: 32px;">⚡</span>
                        </div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; text-transform: uppercase;">Meeting Confirmed</h1>
                        <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.3em;">Protocol Synchronized</p>
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 0 40px 40px 40px;">
                        
                        <!-- Event Card -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; margin-bottom: 32px;">
                            <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 800; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px;">${type.name || type.title}</h2>
                            
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; width: 50%;">
                                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">${date}</p>
                                    </td>
                                    <td style="padding: 8px 0; width: 50%;">
                                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Time</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">${time}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 0 8px 0;">
                                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">${type.duration} Minutes</p>
                                    </td>
                                    <td style="padding: 16px 0 8px 0;">
                                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Host</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">${type.host?.firstName} ${type.host?.lastName}</p>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        ${extraDetailsHtml}

                        <!-- Intake Details -->
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); border-radius: 24px; padding: 32px; margin-bottom: 32px;">
                            <h3 style="margin: 0 0 20px 0; font-size: 12px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px;">Your Information</h3>
                            ${intakeDetailsHtml}
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center;">
                            <a href="${ctaLink}" style="display: block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 24px; border-radius: 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);">${ctaText}</a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
                        <p style="margin: 0; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 3px;">Powered by Agencify Cloud OS</p>
                    </div>
                </div>
            </div>
        `;

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: EMAIL_CONFIG.SERVICE_ID,
                template_id: EMAIL_CONFIG.TEMPLATE_ID,
                user_id: EMAIL_CONFIG.PUBLIC_KEY,
                template_params: {
                    to_email: toEmail,
                    recipient_email: toEmail,
                    email: toEmail,
                    to_name: name,
                    recipient_name: name,
                    from_name: 'Agencify',
                    subject: `Confirmed: ${type.name || type.title}`,
                    message: `Your meeting is confirmed for ${date} at ${time}.`,
                    html_content: emailHtml,
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Email dispatch failed: ${errText}`);
        }
        console.log("Email sent successfully");
    } catch (e) {
        console.error("Email Error", e);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) return;

    setIsProcessing(true);
    setProtocolStatus("Allocating Secure Channel...");
    
    const bookingId = `BK-${Date.now()}`;
    const guestEmail = formData['Email Address'];
    const guestName = formData['Full Name'] || 'Guest';

    // Simulate Processing Delay
    await new Promise(r => setTimeout(r, 1000));
    setProtocolStatus("Generating Meeting Uplink...");
    
    // Generate Meeting Link
    const suffix = bookingType.location_url || 'meeting';
    const random5 = Math.floor(10000 + Math.random() * 90000);
    const finalMeetLink = bookingType.locationType === 'Web Conference' 
        ? `https://meet.jit.si/agencify/${suffix}-${random5}`
        : (bookingType.locationType || 'Scheduled Meeting');
    
    let ctaText = "Join Meeting Protocol";
    let ctaLink = finalMeetLink;
    let extraDetailsHtml = "";

    if (bookingType.locationType === 'Phone Call') {
        ctaText = "Contact Details";
        ctaLink = `tel:${bookingType.country_code || ''}${bookingType.phone_number || ''}`;
        extraDetailsHtml = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 20px 0; font-size: 12px; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: 2px;">Phone Contact</h3>
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Phone Number</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #e2e8f0;">${bookingType.country_code || ''} ${bookingType.phone_number || ''}</p>
                </div>
            </div>
        `;
    } else if (bookingType.locationType === 'In-Person') {
        ctaText = "Open Address";
        const fullAddress = `${bookingType.address_street || ''}, ${bookingType.address_city || ''}, ${bookingType.address_state || ''} ${bookingType.address_zip || ''}, ${bookingType.address_country || ''}`;
        ctaLink = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
        extraDetailsHtml = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 20px 0; font-size: 12px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px;">Location Details</h3>
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Meeting Spot</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #e2e8f0;">${fullAddress}</p>
                </div>
                ${bookingType.phone_number ? `
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Contact Phone</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #e2e8f0;">${bookingType.country_code || ''} ${bookingType.phone_number}</p>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    const dateStr = getLocalDateString(selectedDate);
    
    const newBooking = {
      id: bookingId,
      eventType: bookingType.id,
      workspace_id: bookingType.workspace_id,
      title: bookingType.name || bookingType.title,
      client: guestName,
      clientEmail: guestEmail || '',
      dueDate: dateStr,
      dueTime: selectedTime,
      duration: bookingType.duration,
      status: 'Confirmed',
      meetUrl: ctaLink,
      description: `Scheduled via public page for ${bookingType.title}`
    };

    // Save to DB
    await addBooking(newBooking);
    
    setProtocolStatus("Dispatching Confirmation...");
    
    // Send Email
    if (guestEmail) {
        await sendBookingEmail(guestEmail, guestName, dateStr, selectedTime, formData, bookingType, ctaText, ctaLink, extraDetailsHtml);
    }
    
    setIsProcessing(false);
    setStep('Success');
  };

  const resetFlow = () => {
      setStep('Date');
      setSelectedTime(null);
      setFormData({});
      setIsProcessing(false);
  };

  if (loading) return (
      <div className="flex h-screen items-center justify-center bg-[#0c0f17] text-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Loading Protocol...</p>
          </div>
      </div>
  );

  if (!bookingType) return (
    <div className="flex h-screen items-center justify-center bg-[#0c0f17] text-white">
        <div className="text-center space-y-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl inline-block">
            <ShieldCheck size={32} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black">Protocol Not Found</h2>
          <p className="text-zinc-500 max-w-xs mx-auto">The booking link you followed is invalid or has been deactivated.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Return to Base</button>
        </div>
    </div>
);

  return (
    <div className="fixed inset-0 bg-[#0c0f17] text-white font-sans overflow-hidden flex flex-col selection:bg-blue-600/30">
      
      {isProcessing && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-in fade-in">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-10 h-10 text-blue-500" />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">{protocolStatus}</p>
         </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel: Event Info */}
        <div className="w-full md:w-[400px] bg-[#0f172a]/50 border-r border-white/5 p-10 flex flex-col overflow-y-auto no-scrollbar shrink-0">
           <div className="mb-12">
               {step !== 'Date' && step !== 'Success' ? (
                   <button onClick={() => setStep('Date')} className="p-3 w-fit bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
                       <ArrowLeft size={20} />
                   </button>
               ) : (
                   <div className="p-3 w-fit bg-blue-600/10 border border-blue-600/20 text-blue-500 rounded-2xl">
                       <Zap size={24} />
                   </div>
               )}
           </div>

           <div className="space-y-12">
              <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
                 <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/5 shadow-2xl">
                    <img src={bookingType.host?.avatar || 'https://i.pravatar.cc/150?u=host'} className="w-full h-full object-cover" alt="Host" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500 mb-1">{bookingType.host?.firstName} {bookingType.host?.lastName}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{bookingType.host?.title || 'Agency Stakeholder'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h1 className="text-3xl font-black tracking-tight leading-none">{bookingType.name || bookingType.title}</h1>
                 <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-2 text-zinc-400 font-bold text-xs"><Clock size={16} className="text-blue-500" /> {bookingType.duration} Minutes</span>
                    <span className="flex items-center gap-2 text-zinc-400 font-bold text-xs">
                      {bookingType.locationType === 'Web Conference' ? <Video size={16} className="text-indigo-500" /> : <MapPin size={16} className="text-emerald-500" />} 
                      {bookingType.locationProvider || bookingType.locationType || 'Remote'}
                    </span>
                 </div>
              </div>

              <div className="h-px bg-white/5" />

              <p 
                className="text-sm text-zinc-400 leading-relaxed font-medium"
                style={{
                    color: bookingType.descriptionStyle?.color,
                    fontWeight: bookingType.descriptionStyle?.fontWeight,
                    fontStyle: bookingType.descriptionStyle?.fontStyle
                }}
              >
                 {bookingType.description || "No specific briefing provided for this protocol."}
              </p>

              <div className="mt-auto pt-10">
                 <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center gap-4">
                    <ShieldCheck size={24} className="text-blue-500/50" />
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Secured by Agencify Cloud</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Panel: Scheduler */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#09090b]">
           <div className="max-w-4xl mx-auto w-full p-8 md:p-16">
              {step === 'Date' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4">
                    {/* Calendar Column */}
                    <div className="lg:col-span-7 space-y-8">
                       <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-black text-white uppercase tracking-widest">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                          <div className="flex gap-2">
                             <button onClick={handlePrevMonth} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"><ChevronLeft size={18}/></button>
                             <button onClick={handleNextMonth} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"><ChevronRight size={18}/></button>
                          </div>
                       </div>

                       <div className="grid grid-cols-7 gap-2 mb-4 border-b border-white/5 pb-6">
                          {DAYS.map(d => (
                             <div key={d} className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{d}</div>
                          ))}
                       </div>

                       <div className="grid grid-cols-7 gap-2">
                          {daysInMonth.map((d, i) => {
                             const isSelected = d.currentMonth && d.day === selectedDate.getDate() && viewDate.getMonth() === selectedDate.getMonth() && viewDate.getFullYear() === selectedDate.getFullYear();
                             const isPast = d.currentMonth && new Date(viewDate.getFullYear(), viewDate.getMonth(), d.day) < new Date(new Date().setHours(0,0,0,0));

                             return (
                                <button 
                                   key={i}
                                   disabled={!d.currentMonth || isPast}
                                   onClick={() => {
                                      if (d.currentMonth) {
                                         setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d.day));
                                         setSelectedTime(null);
                                      }
                                   }}
                                   className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden border ${
                                      !d.currentMonth || isPast ? 'opacity-10 pointer-events-none' : 
                                      isSelected ? 'bg-blue-600 border-blue-600 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                   }`}
                                >
                                   <span className={`text-base font-black ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{d.day}</span>
                                </button>
                             );
                          })}
                       </div>
                    </div>

                    {/* Time Slots Column */}
                    <div className="lg:col-span-5 border-l border-white/5 pl-12 space-y-8">
                       <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Available Slots for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          
                          {availableTimeSlots.length > 0 ? (
                            <div className="space-y-3">
                               {availableTimeSlots.map(slot => (
                                  <button 
                                     key={slot}
                                     onClick={() => setSelectedTime(slot)}
                                     className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                                        selectedTime === slot 
                                        ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20' 
                                        : 'bg-[#0f172a] border-white/5 hover:border-blue-500/50'
                                     }`}
                                  >
                                     <span className={`text-sm font-black ${selectedTime === slot ? 'text-white' : 'text-blue-400'}`}>{slot}</span>
                                     {selectedTime === slot && (
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-in slide-in-from-left-2">
                                           <ArrowRight size={16} className="text-white" />
                                        </div>
                                     )}
                                  </button>
                               ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                               <Clock size={32} className="text-zinc-600 mb-2"/>
                               <p className="text-xs font-bold text-zinc-500">No availability</p>
                            </div>
                          )}
                       </div>
                       
                       <button 
                          disabled={!selectedTime}
                          onClick={() => setStep('Intake')}
                          className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                             selectedTime 
                             ? 'bg-blue-600 text-white hover:bg-blue-700' 
                             : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                       >
                          Secure Slot
                       </button>
                    </div>
                 </div>
              )}

              {step === 'Intake' && (
                 <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-xl"><Lock size={32}/></div>
                       <div>
                          <h2 className="text-3xl font-black">Mission Parameters</h2>
                          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Registry Synchronization Required</p>
                       </div>
                    </div>

                    <form onSubmit={handleBook} className="space-y-8">
                       {(bookingType.intakeFields || []).map((field: any) => (
                          <div key={field.id} className="space-y-3">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{field.label}</label>
                             {field.type === 'textarea' ? (
                                <textarea 
                                   required={field.required}
                                   onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                   className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-blue-100/10 focus:border-blue-600 transition-all font-medium text-lg min-h-[160px] resize-none"
                                />
                             ) : (
                                <input 
                                   type="text"
                                   required={field.required}
                                   onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                   className="w-full p-8 bg-white/5 border border-white/10 rounded-full outline-none focus:ring-4 focus:ring-blue-100/10 focus:border-blue-600 transition-all font-black text-xl"
                                />
                             )}
                          </div>
                       ))}

                       <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] space-y-6">
                          <div className="flex items-center justify-between">
                             <p className="text-xs font-bold text-zinc-500">Selected Window</p>
                             <p className="text-sm font-black text-blue-400">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center justify-between">
                             <p className="text-xs font-bold text-zinc-500">Selected Time</p>
                             <p className="text-sm font-black text-blue-400">{selectedTime}</p>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <button type="button" onClick={() => setStep('Date')} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Go Back</button>
                          <button type="submit" className="flex-[2] py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Finalize Authorization</button>
                       </div>
                    </form>
                 </div>
              )}

              {step === 'Success' && (
                 <div className="max-w-2xl mx-auto py-20 text-center space-y-10 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce-subtle">
                       <CheckCircle2 size={48} className="text-white" />
                    </div>
                    <div className="space-y-4">
                       <h2 className="text-5xl font-black tracking-tight">Mission Registered.</h2>
                       <p className="text-zinc-500 text-xl font-medium max-w-sm mx-auto">Tactical window confirmed. Details transmitted.</p>
                    </div>
                    
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[3.5rem] p-10 space-y-6 text-left">
                       <div className="flex items-center justify-between text-[11px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4">
                          <span>Transmission Record</span>
                          <span className="text-emerald-500">Verified</span>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-4">
                             <Mail className="text-blue-500" size={18} />
                             <div>
                                <p className="text-xs font-bold text-zinc-400">Confirmation Link sent to:</p>
                                <p className="text-sm font-black text-white">{formData['Email Address'] || 'Verified Recipient'}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={resetFlow}
                      className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 mx-auto"
                    >
                       <RefreshCw size={14} strokeWidth={3} /> Book Another Session
                    </button>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Footer Branding & Timezone */}
      <div className="h-20 bg-[#0c0f17] border-t border-white/5 px-10 flex items-center justify-between shrink-0 z-50">
         <div className="relative">
            <button 
               onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
               className="flex items-center gap-4 text-zinc-500 hover:text-white transition-colors group"
            >
               <Globe size={18} className="group-hover:text-blue-500" />
               <span className="text-xs font-black uppercase tracking-[0.2em]">{selectedTimezone}</span>
               <ChevronDown size={14} className={`transition-transform duration-300 ${isTimezoneOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimezoneOpen && (
               <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#111114] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 p-1 z-[100]">
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                     {ALL_TIMEZONES.map((tz: string) => (
                        <button 
                           key={tz}
                           onClick={() => { setSelectedTimezone(tz); setIsTimezoneOpen(false); }}
                           className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedTimezone === tz ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                        >
                           {tz}
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Powered by</span>
            <span className="text-lg font-black text-white tracking-tighter">Agencify</span>
         </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;
