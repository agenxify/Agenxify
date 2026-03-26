import { usePages } from '../hooks/usePages';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, MonitorPlay, Undo2, Redo2, Settings, Share2, MoreHorizontal,
  Plus, Type, Image as ImageIcon, Video, Square, GripVertical, Check, Loader2,
  Trash2, X, Globe, Link as LinkIcon, Search, ChevronDown, LayoutTemplate,
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Palette, Smartphone, Monitor, Maximize2, Layers, CloudUpload, LayoutGrid,
  ArrowUpDown, Folder, Pin, File, FileText, Table, Columns, Smile, WrapText,
  PenTool, MousePointerClick, GalleryHorizontal, FileUp, PanelTop, Box, Minus, Database,
  ChevronsRight, RotateCw, AlignJustify, List as ListIcon, ListOrdered, 
  CheckSquare as CheckListIcon, Link as LinkIcon2, Superscript, Type as TypeIcon, Minimize2,
  Youtube, Download, FileIcon, RefreshCw, Info, AlertTriangle, CheckCircle2, XCircle,
  Settings2, ImagePlus, Copy, Bell, Flame, Star, Zap, HelpCircle,
  Hash as NumberIcon, CalendarDays, Users as UsersIcon, ListFilter, CheckSquare, ChevronLeft, ChevronRight, User,
  ChevronDownCircle, ListChecks, AlignStartVertical, AlignCenterVertical, AlignEndVertical, 
  AlignJustify as AlignJustifyIcon, MoveHorizontal, MoveVertical, RefreshCcw, 
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Clock, Dog, Apple, Trophy, Car, Lightbulb, Music, Flag, Eraser, ChevronRightSquare, ChevronLeftSquare, Keyboard,
  Upload, ShieldCheck, SlidersHorizontal, Settings as GearIcon, ExternalLink, MoreVertical as DotsVertical,
  ArrowRightCircle, Mail, Play, Rocket, Terminal, Target, Heart, Bookmark, Command, Coffee, Code
} from 'lucide-react';
import { Page, PageBlock, PageTemplate } from '../types';
import { MOCK_PAGES, MOCK_TEMPLATES, MOCK_CLIENTS, MOCK_PROJECTS, MOCK_INVOICES, MOCK_PROFILES } from '../constants';
import * as ReactRouterDom from 'react-router-dom';

const { useParams, useNavigate } = ReactRouterDom as any;

// --- Constants ---
const AVAILABLE_FONTS = [
  "Inter", "Roboto", "Poppins", "Merriweather", "Playfair Display", 
  "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway", 
  "Nunito", "Ubuntu", "Rubik", "Mukta", "Kanit", 
  "Anton", "Cabin", "Fira Sans", "Inconsolata", "Quicksand", 
  "Work Sans", "Crimson Text", "DM Sans", "PT Sans", "PT Serif", "Lora"
];

const SIGNATURE_FONTS = [
  'Dancing Script', 'Pacifico', 'Satisfy', 'Parisienne', 'Cookie', 
  'Great Vibes', 'Alex Brush', 'Allura', 'Rochester', 'Sacramento', 
  'Yellowtail', 'cursive'
];

const AVAILABLE_ICONS: Record<string, any> = {
  'ArrowRight': ArrowRightCircle,
  'Zap': Zap,
  'Star': Star,
  'Heart': Heart,
  'Plus': Plus,
  'Mail': Mail,
  'Play': Play,
  'Rocket': Rocket,
  'Check': Check,
  'Terminal': Terminal,
  'Target': Target,
  'Bookmark': Bookmark,
  'Command': Command,
  'Coffee': Coffee,
  'Globe': Globe,
  'Link': LinkIcon
};

// --- Emoji Search Keywords ---
const EMOJI_KEYWORDS: Record<string, string[]> = {
  'happy': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'sad': ['😞', '😔', '😟', '😕', '🙁', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯'],
  'sick': ['🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  'cool': ['😎', '🤩', '🥳'],
  'sleep': ['🥱', '😴', '🤤', '😪'],
  'love': ['😍', '🥰', '😘', '😗', '😙', '😚', '❤️', '🧡', '💛', '💚', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'dog': ['🐶', '🐕', '🦮', '🐩'],
  'cat': ['🐱', '🐈', '🐅', '🐆', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  'fruit': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍'],
  'fast food': ['🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯'],
  'car': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '武器', '🚓', '🚑', '🚒', '🚐'],
  'flag': ['🏁', '🚩', '🎌', '🏴', '🏳️'],
  'sport': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹'],
  'tech': ['📱', '📲', '电脑', '键盘', '鼠标', '🖲️', '摇杆', '🗜️', '光盘', '磁盘', '软盘', 'DVD'],
  'fire': ['🔥'],
  'rocket': ['🚀'],
  'sparkle': ['✨', '🌟', '💫', '🌟'],
  'target': ['🎯'],
  'money': ['💰', '💸', '💵', '💴', '💶', '💷', '🪙', '💳'],
};

const EMOJI_CATEGORIES = [
  { id: 'smileys', label: 'Smileys & People', icon: Smile, emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'] },
  { id: 'animals', label: 'Animals & Nature', icon: Dog, emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙊', '🐒', '🦍', '🦧', '🐕', '🦮', '🐩', '🐺', '🦝', '🐈', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐂', '🐃', '🐄', '🐖', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌍', '🌎', '🌏', '🪐', '💫', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅️', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄️', '🌬️', '💨', '💧', '💦', '☔️', '☂️', '🌊', '🌫️'] },
  { id: 'food', label: 'Food & Drink', icon: Apple, emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '揶', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥣', '🍿', '🥣', '🧂', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '顾问', '🍯', '🍼', '🥛', '☕️', '🫫', '🍵', '🍶', '啤酒', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥤'] },
  { id: 'activities', label: 'Activities', icon: Trophy, emojis: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '捕手', '🛼', '🛷', '⛸️', '🎿', '⛷️', '博博', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', ' bowling', '🎮', '🎰', '🧩'] },
  { id: 'travel', label: 'Travel & Places', icon: Car, emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '武器', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '坦克', '🛵', '摩托车', '🛺', '自行车', '滑板车', '滑板', '🚏', '🛣️', '🛤️', '加油站', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '帆船', '快艇', '邮轮', '渡轮', '轮船', '飞机', '🛩️', '🛫', '🛬', '🪂', '💺', '直升机', '🚟', '缆车', '空中缆车', '卫星', '火箭', '幽浮', '🌠', '🌌', '⛱️', '🎆', '🎇', '🎑', '🏙️', '🌇', '🌅', '🌆', '🌃', '🌉', '🌁', '🗾', '火山', '富士山', '🏔️', '⛰️', '露营', '海滩', '沙漠', '岛屿', '体育场', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '办公楼', '邮局', '医院', '银行', '酒店', '情趣酒店', '便利店', '学校', '百货商店', '工厂', '日式城堡', '欧式城堡', '婚礼', '东京塔', '自由女神', '教堂', '清真寺', '印度教寺庙', '犹太教堂', '神社', '克尔白'] },
  { id: 'objects', label: 'Objects', icon: Lightbulb, emojis: ['⌚️', '手机', '📲', '电脑', '键盘', '鼠标', '🖲️', '摇杆', '🗜️', '光盘', '磁盘', '软盘', 'DVD', '磁带', '相机', '📸', '视频', '🎥', '投影仪', '胶卷', '电话', '☎️', '寻互机', '传真机', '电视', '广播', '麦克风', '均衡器', '控制旋钮', '指南针', '秒表', '定时器', '闹钟', '钟', '沙漏', '计时沙漏', '卫星天线', '电池', '插头', '电灯泡', '手电筒', '蜡烛', '排灯节灯', '灭火器', '油桶', '钞票', '美元', '日元', '欧元', '英镑', '钱币', '钱袋', '信用卡', '钻石', '天平', '梯子', '工具箱', '螺丝刀', '扳手', '锤子', '⚒️', '🛠️', '⛏️', '锯子', '螺栓', '齿轮', '捕鼠器', '砖头', '链条', '磁铁', '水枪', '炸弹', '鞭炮', '斧头', '菜刀', '匕首', '宝剑', '盾牌', '香烟', '棺材', '墓碑', '骨灰盒', '双耳瓶', '水晶球', '念珠', '护身符', '理发店', '蒸馏器', '望远镜', '显微镜', '黑洞', '膏药', '听诊器', '胶囊', '注射器', '血滴', 'DNA', '微生物', '培养皿', '试管', '温度计', '扫把', '篮子', '卫生纸', '马桶', '水龙头', '淋浴', '浴缸', '肥皂', '牙刷', '刮胡刀', '海绵', '水桶', '乳液瓶', '接待铃', '钥匙', '古老钥匙', '门', '椅子', '沙发', '床', '睡觉', '泰迪熊', '俄罗斯套娃', '相框', '镜子', '礼物', '气球', '鲤鱼旗', '缎带', '魔术棒', '彩陶罐', '五彩纸屑', '庆祝', '女儿节', '灯笼', '风铃', '红包', '信封', '收信', '来信', '电子邮件', '情书', '收件箱', '发件箱', '包裹', '标签', '公告牌', '信箱', '满信箱', '有信箱', '空信箱', '邮筒', '喇叭', '卷轴', '页面', '文件', '书签栏', '图表', '上升', '下降', '备忘录', '日历', '月历', '日程', '垃圾桶', '卡片索引', '卡片盒', '投票箱', '文件夹', '剪切板', '文件夹', '打开文件夹', '卡片索引', '报纸', '新闻', '笔记本', '装饰笔记', '记账', '红皮书', '绿皮书', '蓝皮书', '橙皮书', '书本', '打开的书', '书签', '别针', '链接', '曲别针', '连结曲别针', '三角尺', '直尺', '算盘', '图钉', '大头针', '剪刀', '钢笔', '钢笔头', '墨水笔', '画笔', '蜡笔', '笔记', '铅笔', '放大镜', '右斜放大镜', '私密锁', '带笔锁', '锁', '开锁'] },
  { id: 'symbols', label: 'Symbols', icon: Music, emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '外星人', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '探索', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '禁', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '锁定', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '👁‍🗨', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫', '🔈', '减轻', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'] },
  { id: 'flags', label: 'Flags', icon: Flag, emojis: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇮🇴', '🇮🇴', '🇮🇴', '极地', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇸🇿', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴', '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲', '🇯🇵', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽商', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳評', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇰', '🇲🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸', '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺', '🇷🇼', '🇼🇸', '🇸🇲', '🇸🇹', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽', '🇸🇰', '🇸🇮', '🇬🇸', '🇸🇧', '🇸🇴', '🇿🇦', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇻🇮', '🇺🇬', '🇺🇦', '🇦🇪', '🇬🇧', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼'] },
];

const hexToHsv = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (!hex || hex.startsWith('linear') || hex.startsWith('radial')) return { h: 0, s: 0, v: 100 };
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt("0x" + hex[0] + hex[0]);
    g = parseInt("0x" + hex[1] + hex[1]);
    b = parseInt("0x" + hex[2] + hex[2]);
  } else if (hex.length === 6) {
    r = parseInt("0x" + hex.substring(0, 2));
    g = parseInt("0x" + hex.substring(2, 4));
    b = parseInt("0x" + hex.substring(4, 6));
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max === min) h = 0;
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = (h: number, s: number, v: number) => {
  let r, g, b;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s / 100);
  const q = v * (1 - f * s / 100);
  const t = v * (1 - (1 - f) * s / 100);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 2.55).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
};

// --- Missing Helper Components ---

const PremiumSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
      <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{value}</span>
    </div>
    <div className="relative h-6 flex items-center group">
       <div className="absolute w-full h-1 bg-zinc-800 rounded-full" />
       <div 
          className="absolute h-1 bg-blue-600 rounded-full" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
       />
       <input 
         type="range" min={min} max={max} step={step} value={value}
         onChange={(e) => onChange(parseFloat(e.target.value))}
         className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
       />
       <div 
         className="absolute w-4 h-4 bg-white rounded-full border-2 border-blue-600 shadow-lg pointer-events-none group-hover:scale-110 transition-transform"
         style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
       />
    </div>
  </div>
);

const EmojiPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void, onClose: () => void }) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('smileys');

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES.find(c => c.id === activeCat)?.emojis || [];
    const query = search.toLowerCase();
    let results: string[] = [];
    Object.entries(EMOJI_KEYWORDS).forEach(([key, list]) => {
        if (key.includes(query)) results = [...results, ...list];
    });
    return Array.from(new Set(results));
  }, [search, activeCat]);

  return (
    <div className="w-[320px] bg-[#1e1e24] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
      <div className="p-3 bg-white/5 border-b border-zinc-800">
        <div className="relative flex items-center">
           <Search size={14} className="absolute left-3 text-zinc-500" />
           <input 
             autoFocus
             placeholder="Search emojis..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-blue-500"
           />
        </div>
      </div>
      <div className="flex-1 max-h-64 overflow-y-auto p-4 no-scrollbar">
         <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((e, i) => (
               <button key={i} onClick={() => { onSelect(e); onClose(); }} className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition-all hover:scale-125">{e}</button>
            ))}
         </div>
      </div>
      {!search && (
         <div className="p-2 border-t border-zinc-800 flex justify-between bg-black/20 overflow-x-auto no-scrollbar">
            {EMOJI_CATEGORIES.map(cat => (
               <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`p-2 rounded-lg transition-all ${activeCat === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} title={cat.label}>
                  <cat.icon size={16} />
               </button>
            ))}
         </div>
      )}
    </div>
  );
};

const ColumnBlock = ({ block, isSelected, onChange, richStyle, onOpenSettings }: any) => {
    const columns = useMemo(() => {
        try { return JSON.parse(block.content); } catch(e) { return [['']]; }
    }, [block.content]);

    const updateCol = (idx: number, val: string) => {
        const next = [...columns];
        next[idx][0] = val;
        onChange({ ...block, content: JSON.stringify(next) });
    };

    return (
        <div className="w-full relative group/col">
            <div className="flex gap-8" style={{ padding: `${block.properties?.padding || 0}px` }}>
                {columns.map((col: string[], i: number) => (
                    <div key={i} className="flex-1 space-y-4">
                        <textarea 
                            value={col[0]}
                            onChange={(e) => updateCol(i, e.target.value)}
                            onInput={(e) => {
                                (e.target as any).style.height = 'auto';
                                (e.target as any).style.height = (e.target as any).scrollHeight + 'px';
                            }}
                            style={richStyle}
                            className="w-full bg-transparent outline-none resize-none overflow-hidden text-sm"
                            placeholder="Column content..."
                            rows={1}
                        />
                    </div>
                ))}
            </div>
            {isSelected && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                  className="absolute -top-3 -right-3 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg shadow-lg hover:bg-zinc-700 transition-colors z-20"
                >
                   <Settings2 size={16} />
                </button>
            )}
        </div>
    );
};

const SectionSettingsModal = ({ initial, onSave, onChange, onDelete, onClose, onOpenColorPicker }: any) => {
    const [data, setData] = useState(initial || {});
    const update = (key: string, val: any) => {
        const newData = { ...data, [key]: val };
        setData(newData);
        if (onChange) onChange(newData);
    };

    return (
        <div className="w-[320px] bg-[#1e1e24] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Section Settings</h3>
                <button onClick={onClose}><X size={18} className="text-zinc-500 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                <PremiumSlider label="Inner Padding" value={data.padding || 0} min={0} max={100} onChange={(v: any) => update('padding', v)} />
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Background Color</label>
                    <div 
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onOpenColorPicker(rect, data.backgroundColor || '#000000', (c: string) => update('backgroundColor', c));
                        }}
                        className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700 cursor-pointer hover:bg-zinc-750 transition-all"
                    >
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-lg" style={{ background: data.backgroundColor || 'transparent' }} />
                        <span className="text-xs font-bold text-zinc-300">{data.backgroundColor || 'Select color'}</span>
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-zinc-800 bg-black/10 flex gap-3">
                <button onClick={onDelete} className="flex-1 py-3 rounded-xl border border-rose-900/50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-900/10">Delete</button>
                <button 
                    onClick={() => {
                        if (onChange) {
                            onClose();
                        } else {
                            onSave(data);
                        }
                    }} 
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                >
                    {onChange ? 'Done' : 'Save'}
                </button>
            </div>
        </div>
    );
};

const SignatureModal = ({ initialValue, initialMeta, onSave, onChange, onClose, onDelete, onOpenColorPicker }: { initialValue: string, initialMeta: any, onSave: (v: string, m: any) => void, onChange?: (v: string, m: any) => void, onClose: () => void, onDelete: () => void, onOpenColorPicker: any }) => {
    const [mode, setMode] = useState<'DRAW' | 'TYPE'>(initialMeta.mode || 'DRAW');
    const [sigData, setSigData] = useState(initialValue || '');
    const [meta, setMeta] = useState({
        name: initialMeta.name || '',
        email: initialMeta.email || '',
        font: initialMeta.font || 'Pacifico',
        date: initialMeta.date || new Date().toISOString().split('T')[0],
        color: initialMeta.color || '#000000'
    });

    const updateMeta = (key: string, val: string) => {
        const newMeta = { ...meta, [key]: val };
        setMeta(newMeta);
        if (onChange) onChange(sigData, { ...newMeta, mode });
    };

    const handleSigDataChange = (val: string) => {
        setSigData(val);
        if (onChange) onChange(val, { ...meta, mode });
    };

    const handleModeChange = (newMode: 'DRAW' | 'TYPE') => {
        setMode(newMode);
        if (onChange) onChange(sigData, { ...meta, mode: newMode });
    };

    return (
        <div className="w-[640px] bg-[#18181b] border border-zinc-700 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-black text-white tracking-tight">Security Signature</h3>
                <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-zinc-800">
                    <button onClick={() => handleModeChange('DRAW')} className={`px-5 py-2 text-[10px] font-black tracking-widest rounded-lg transition-all ${mode === 'DRAW' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>DRAW</button>
                    <button onClick={() => handleModeChange('TYPE')} className={`px-5 py-2 text-[10px] font-black tracking-widest rounded-lg transition-all ${mode === 'TYPE' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>TYPE</button>
                </div>
            </div>

            <div className="flex-1 p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Signatory Name</label>
                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600" value={meta.name} onChange={e => updateMeta('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Verified Email</label>
                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600" value={meta.email} onChange={e => updateMeta('email', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Signature Color</label>
                    <div 
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onOpenColorPicker(rect, meta.color, (c: string) => updateMeta('color', c));
                        }}
                        className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all"
                    >
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: meta.color }} />
                        <span className="text-sm font-bold text-zinc-300">{meta.color}</span>
                    </div>
                </div>

                <div className="relative">
                    {mode === 'DRAW' ? (
                        <SignaturePad value={sigData} onChange={handleSigDataChange} color={meta.color} thickness={3} />
                    ) : (
                        <div className="space-y-6">
                            <input 
                                value={sigData} 
                                onChange={e => handleSigDataChange(e.target.value)}
                                className="w-full h-32 bg-white text-6xl text-center rounded-[2rem] outline-none border-4 border-zinc-800 shadow-inner px-8"
                                style={{ fontFamily: meta.font, color: meta.color }}
                                placeholder="Type signature..."
                            />
                            <div className="grid grid-cols-4 gap-2 h-32 overflow-y-auto no-scrollbar p-2 bg-black/20 rounded-2xl border border-zinc-800">
                                {SIGNATURE_FONTS.map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => updateMeta('font', f)}
                                        className={`p-3 rounded-xl text-lg truncate transition-all ${meta.font === f ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
                                        style={{ fontFamily: f }}
                                    >
                                        {sigData || 'Signature'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 border-t border-zinc-800 bg-black/10 flex justify-between gap-4">
                <button onClick={onDelete} className="px-8 py-4 border border-rose-900/50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-900/20 transition-all"><Trash2 size={18}/></button>
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-8 py-4 text-zinc-500 hover:text-white font-black text-xs uppercase tracking-widest">Cancel</button>
                    <button 
                        onClick={() => {
                            if (onChange) {
                                onClose();
                            } else {
                                onSave(sigData, { ...meta, mode });
                            }
                        }}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        {onChange ? 'Done' : 'Apply Signature'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Embed Modal ---
const EmbedModal = ({ initialContent, onSave, onClose }: { initialContent: string, onSave: (v: string) => void, onClose: () => void }) => {
    const [val, setVal] = useState(initialContent || '');
    return (
        <div className="w-[480px] bg-[#1e1e24] border border-zinc-700 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-black text-white tracking-tight">External Resource Link</h3>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
                <p className="text-xs font-medium text-zinc-400 leading-relaxed">Embed live dashboards, calendars (Calendly, etc.), or generic HTML/Iframe source code directly into your page.</p>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">SOURCE URL OR IFRAME CODE</label>
                    <textarea 
                        autoFocus
                        value={val} 
                        onChange={e => setVal(e.target.value)}
                        className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white text-sm font-mono outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all resize-none"
                        placeholder="<iframe src='...' /> or https://..."
                    />
                </div>
            </div>
            <div className="p-8 border-t border-zinc-800 bg-black/10 flex justify-end gap-4">
                <button onClick={onClose} className="px-8 py-4 text-zinc-500 hover:text-white font-black text-xs uppercase tracking-widest">Cancel</button>
                <button 
                    onClick={() => onSave(val)}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                >
                    Apply Embed
                </button>
            </div>
        </div>
    );
};

// --- Colorbox Modal ---
const ColorboxSettingsModal = ({ initial, onSave, onDelete, onClose, onOpenColorPicker }: any) => {
    const [data, setData] = useState(initial || { padding: 40, backgroundColor: '#2563eb10' });
    const update = (key: string, val: any) => setData((prev: any) => ({ ...prev, [key]: val }));

    return (
        <div className="w-[320px] bg-[#1e1e24] border border-zinc-700 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Container Settings</h3>
                <button onClick={onClose}><X size={18} className="text-zinc-500 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                <PremiumSlider label="Inner Padding" value={data.padding || 40} min={10} max={120} onChange={(v: any) => update('padding', v)} />
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Container Background</label>
                    <div 
                        onClick={(e) => onOpenColorPicker(e.currentTarget.getBoundingClientRect(), data.backgroundColor || '#2563eb10', (c: string) => update('backgroundColor', c))}
                        className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700 cursor-pointer hover:bg-zinc-750 transition-all"
                    >
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-lg" style={{ background: data.backgroundColor || 'transparent' }} />
                        <span className="text-xs font-bold text-zinc-300">{data.backgroundColor || 'Select color'}</span>
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-zinc-800 bg-black/10 flex gap-3">
                <button onClick={onDelete} className="flex-1 py-3 rounded-xl border border-rose-900/50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-900/10">Delete</button>
                <button onClick={() => onSave(data)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Save</button>
            </div>
        </div>
    );
};

// --- Main Components ---

const RippleCheckbox = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => {
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples([...ripples, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onChange(!checked);
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden ${checked ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md' : 'border-2 border-zinc-600 hover:border-zinc-500'}`}
    >
      {checked && <Check size={12} className="text-white relative z-10" strokeWidth={3} />}
      {ripples.map(r => (
        <span 
          key={r.id}
          className="absolute bg-blue-400/30 rounded-full animate-ripple pointer-events-none"
          style={{ left: r.x, top: r.y, transform: 'translate(-50%, -50%)', width: 20, height: 20 }}
        />
      ))}
      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.5; }
          100% { width: 100px; height: 100px; opacity: 0; }
        }
        .animate-ripple { animation: ripple 0.6s linear; }
      `}</style>
    </div>
  );
};

// --- Button Modals ---

const ButtonLinkModal = ({ initial, onSave, onClose }: { initial: any, onSave: (data: any) => void, onClose: () => void }) => {
    const [linkType, setLinkType] = useState(initial.linkType || 'web');
    const [url, setUrl] = useState(initial.url || 'https://');
    const [openInNewTab, setOpenInNewTab] = useState(initial.openInNewTab || false);

    return (
        <div className="w-[520px] bg-[#1e1e24] border border-zinc-700 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-4 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">What do you want to link to?</h3>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"><X size={20}/></button>
            </div>
            <div className="h-px bg-zinc-800 mx-8 opacity-50" />
            
            <div className="flex divide-x divide-zinc-800 min-h-[280px]">
                <div className="w-1/2 p-8 space-y-5">
                    {[
                        { id: 'none', label: 'None' },
                        { id: 'web', label: 'Web Address' },
                        { id: 'page', label: 'Top/Bottom of page' },
                        { id: 'email', label: 'Email' },
                        { id: 'phone', label: 'Phone number' }
                    ].map(opt => (
                        <div key={opt.id} className="flex items-center gap-4 cursor-pointer group" onClick={() => setLinkType(opt.id)}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${linkType === opt.id ? 'border-blue-500' : 'border-zinc-700'}`}>
                                {linkType === opt.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                            <span className={`text-sm font-bold transition-colors ${linkType === opt.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{opt.label}</span>
                        </div>
                    ))}
                </div>
                <div className="w-1/2 p-8 space-y-6">
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                            placeholder={linkType === 'email' ? 'mailto:...' : linkType === 'phone' ? 'tel:...' : 'https://'}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpenInNewTab(!openInNewTab)}>
                            <div className={`w-5 h-5 rounded border border-zinc-700 flex items-center justify-center transition-all ${openInNewTab ? 'bg-blue-600 border-blue-600' : 'bg-transparent'}`}>
                                {openInNewTab && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold text-zinc-400">Open in new tab</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 pt-4 border-t border-zinc-800 bg-black/10 flex justify-end gap-3">
                <button onClick={onClose} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                <button 
                    onClick={() => onSave({ linkType, url, openInNewTab })}
                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

const ButtonSettingsModal = ({ initial, onSave, onChange, onDelete, onClose, onOpenColorPicker }: { initial: any, onSave: (data: any) => void, onChange?: (data: any) => void, onDelete: () => void, onClose: () => void, onOpenColorPicker: (rect: DOMRect, current: string, setter: (c: string) => void) => void }) => {
    const [data, setData] = useState(initial || {});
    const [iconSearch, setIconSearch] = useState('');
    
    const update = (key: string, val: any) => {
        const newData = { ...data, [key]: val };
        setData(newData);
        if (onChange) onChange(newData);
    };

    const ColorInput = ({ label, value, field }: { label: string, value: string, field: string }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
            <div 
              onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onOpenColorPicker(rect, value || '#ffffff', (c: string) => update(field, c));
              }}
              className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all group"
            >
                <div className="w-6 h-6 rounded-full border border-white/20 shadow-lg" style={{ background: value || 'transparent' }} />
                <span className="text-xs font-bold text-zinc-300 flex-1">{value || label}</span>
            </div>
        </div>
    );

    const filteredIcons = useMemo(() => {
        return Object.keys(AVAILABLE_ICONS).filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

    return (
        <div className="w-[360px] bg-[#1e1e24] border border-zinc-700 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <h3 className="text-lg font-black text-white tracking-tight">Button</h3>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar max-h-[70vh]">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Button Text</label>
                    <input 
                      value={data.buttonText || ''} 
                      onChange={e => update('buttonText', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Font Family</label>
                        <select 
                          value={data.fontFamily || 'Inter'} 
                          onChange={e => update('fontFamily', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-xs font-bold outline-none"
                        >
                            {AVAILABLE_FONTS.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Font Size</label>
                        <input 
                          type="number" 
                          value={data.fontSize || 16} 
                          onChange={e => update('fontSize', parseInt(e.target.value))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-xs font-bold outline-none" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alignment</label>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800 w-fit">
                        {['left', 'center', 'right'].map(a => (
                            <button key={a} onClick={() => update('align', a)} className={`p-2.5 rounded-lg transition-all ${data.align === a ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                {a === 'left' ? <AlignLeft size={16}/> : a === 'center' ? <AlignCenter size={16}/> : <AlignRight size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <ColorInput label="Text Color" value={data.textColor || '#ffffff'} field="textColor" />
                    <ColorInput label="Button Color" value={data.buttonColor || '#2563eb'} field="buttonColor" />
                    <ColorInput label="Border Color" value={data.borderColor || 'transparent'} field="borderColor" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <div className={`w-5 h-5 rounded border border-zinc-700 flex items-center justify-center transition-all cursor-pointer ${data.hideOnMobile ? 'bg-blue-600 border-blue-600' : ''}`} onClick={() => update('hideOnMobile', !data.hideOnMobile)}>
                        {data.hideOnMobile && <Check size={14} className="text-white"/>}
                    </div>
                    <span className="text-xs font-bold text-zinc-400">Hide on Mobile</span>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-6">
                    <PremiumSlider label="Banner Spacing" value={data.bannerSpacing || 8} min={0} max={100} onChange={(v: any) => update('bannerSpacing', v)} />
                    
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border border-zinc-700 flex items-center justify-center transition-all cursor-pointer ${data.customize ? 'bg-blue-600 border-blue-600' : ''}`} onClick={() => update('customize', !data.customize)}>
                            {data.customize && <Check size={14} className="text-white"/>}
                        </div>
                        <span className="text-xs font-bold text-zinc-400">Customize Width</span>
                    </div>

                    <PremiumSlider label="Border Radius" value={data.borderRadius || 30} min={0} max={100} onChange={(v: any) => update('borderRadius', v)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Border Width</label>
                        <input value={data.borderWidth || '1px'} onChange={e => update('borderWidth', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Border Style</label>
                        <select value={data.borderStyle || 'Solid'} onChange={e => update('borderStyle', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-xs font-bold outline-none">
                            <option>Solid</option><option>Dashed</option><option>Dotted</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Icon Position</label>
                    <select value={data.iconPosition || 'None'} onChange={e => update('iconPosition', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none">
                        <option>Start</option><option>End</option><option>None</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                            placeholder="Search Icons..." 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-600" 
                            value={iconSearch}
                            onChange={e => setIconSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 bg-black/20 rounded-xl border border-zinc-800 no-scrollbar">
                        {filteredIcons.map(name => {
                            const Icon = AVAILABLE_ICONS[name];
                            return (
                                <button 
                                    key={name}
                                    onClick={() => update('selectedIcon', name)}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${data.selectedIcon === name ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                                    title={name}
                                >
                                    <Icon size={16} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <ColorInput label="Hover Text Color" value={data.hoverTextColor || data.textColor} field="hoverTextColor" />
                    <ColorInput label="Hover Button Color" value={data.hoverButtonColor || data.buttonColor} field="hoverButtonColor" />
                    <ColorInput label="Hover Border Color" value={data.hoverBorderColor || data.borderColor} field="hoverBorderColor" />
                </div>
            </div>

            <div className="p-6 border-t border-zinc-800 bg-black/10 flex justify-between gap-3">
                <button onClick={onDelete} className="px-6 py-3 rounded-xl border border-rose-900/50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-900/10 transition-all">Delete</button>
                <button 
                    onClick={() => {
                        if (onChange) {
                            onClose();
                        } else {
                            onSave(data);
                        }
                    }} 
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                >
                    {onChange ? 'Done' : 'Save'}
                </button>
            </div>
        </div>
    );
};

// --- Page Settings Modal (Screenshot-Matched) ---
const PageSettingsModal = ({ settings, onChange, onClose, onOpenColorPicker }: { settings: any, onChange: (s: any) => void, onClose: () => void, onOpenColorPicker: (rect: DOMRect, current: string, setter: (c: string) => void) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const update = (key: string, val: any) => onChange({ ...settings, [key]: val });

    return (
        <div className="w-full h-full bg-[#1e1e24] border-l border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-4 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-black text-white tracking-tight">Page Settings</h3>
                <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 rounded-xl transition-all"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {/* Text Color */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-white tracking-tight">Text</label>
                    <div 
                      onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          onOpenColorPicker(rect, settings.textColor || '#ffffff', (c: string) => update('textColor', c));
                      }}
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-800 transition-all group"
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: settings.textColor || '#ffffff' }} />
                        <span className="text-sm font-bold text-zinc-300">{settings.textColor || 'Select color'}</span>
                    </div>
                </div>

                {/* Background URL */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-white tracking-tight">Background URL</label>
                    <input 
                      value={settings.backgroundUrl || ''} 
                      onChange={e => update('backgroundUrl', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all" 
                      placeholder="https://"
                    />
                </div>

                {/* Upload Image Box */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-white tracking-tight">Upload Image</label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => update('backgroundUrl', ev.target?.result as string);
                             reader.readAsDataURL(file);
                         }
                    }} />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-600/30 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 hover:bg-blue-600/5 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        {settings.backgroundUrl && <img src={settings.backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" alt="" />}
                        <div className="p-4 bg-blue-600/10 rounded-full text-blue-500 group-hover:scale-110 transition-transform relative z-10">
                            <CloudUpload size={32} />
                        </div>
                        <span className="text-sm font-black text-blue-500 relative z-10">Upload a image</span>
                    </div>
                </div>

                {/* Background Color Picker Style */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-white tracking-tight">Background</label>
                    <div 
                      onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          onOpenColorPicker(rect, settings.backgroundColor || '#000000', (c: string) => update('backgroundColor', c));
                      }}
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-800 transition-all group"
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: settings.backgroundColor || '#000000' }} />
                        <span className="text-sm font-bold text-zinc-500">{settings.backgroundColor || 'Select background color'}</span>
                    </div>
                </div>

                {/* Padding Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-black text-white tracking-tight">Padding</label>
                        <div className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center text-xs font-bold text-zinc-400">
                           {settings.padding || 0}
                        </div>
                    </div>
                    <input 
                      type="range" min="0" max="200" step="4" 
                      value={settings.padding || 0}
                      onChange={e => update('padding', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => update('customize', !settings.customize)}>
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${settings.customize ? 'bg-blue-600 border-blue-600' : 'border-zinc-700'}`}>
                          {settings.customize && <Check size={12} className="text-white" strokeWidth={4} />}
                       </div>
                       <span className="text-xs font-bold text-zinc-300">Customize</span>
                    </div>
                </div>

                {/* Line Spacing Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-black text-white tracking-tight">Line Spacing</label>
                        <div className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center text-xs font-bold text-zinc-400">
                           {settings.lineSpacing || 1.43}
                        </div>
                    </div>
                    <input 
                      type="range" min="1" max="3" step="0.01" 
                      value={settings.lineSpacing || 1.43}
                      onChange={e => update('lineSpacing', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                {/* Max Width Input */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-white tracking-tight">Max Width</label>
                    <input 
                      type="number"
                      value={settings.maxWidth || ''} 
                      onChange={e => update('maxWidth', parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all placeholder:text-zinc-500" 
                      placeholder="Maximum width of page in px"
                    />
                </div>
            </div>

            <div className="p-8 border-t border-zinc-800 bg-black/20">
                <button 
                  onClick={onClose}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

// --- Signature Pad Component ---
const SignaturePad = ({ value, onChange, color = '#000000', thickness = 2 }: { value: string, onChange: (v: string) => void, color?: string, thickness?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (value && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = value;
            }
        }
    }, [value]);

    const getPos = (e: any) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        setLastPos(getPos(e));
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current!.getContext('2d');
        if (!ctx) return;
        const currentPos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
        setLastPos(currentPos);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            onChange(canvasRef.current!.toDataURL());
        }
    };

    return (
        <div className="relative bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden" style={{ width: '100%', height: '240px' }}>
            <canvas 
                ref={canvasRef}
                width={800}
                height={240}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
            />
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    const ctx = canvasRef.current?.getContext('2d');
                    ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    onChange('');
                }}
                className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-blue-500 rounded-full transition-all shadow-lg"
                title="Clear Signature"
            >
                <RefreshCcw size={16}/>
            </button>
        </div>
    );
};

// --- Components ---

const CustomCalendar = ({ value, onChange, onClose }: { value: string, onChange: (date: string) => void, onClose: () => void }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
       const strVal = String(value);
       const parts = strVal.split('-');
       if(parts.length === 3) {
           return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
       }
       const d = new Date(value);
       return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  });
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const handleDateClick = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const iso = `${d.getFullYear()}-${month}-${date}`;
    onChange(iso);
    onClose();
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  return (
    <div className="w-[280px] bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><ChevronLeft size={16} /></button>
        <span className="text-sm font-bold text-white">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-zinc-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const currentMonth = (viewDate.getMonth() + 1).toString().padStart(2, '0');
          const currentDate = d.toString().padStart(2, '0');
          const currentIso = `${viewDate.getFullYear()}-${currentMonth}-${currentDate}`;
          const isSelected = value === currentIso;
          
          return (
            <button 
              key={d} 
              onClick={() => handleDateClick(d)}
              className={`h-8 rounded-lg text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const OptionSelectEditor = ({ options = [], value, onChange, onCreate, onClose, single = false }: any) => {
  const [search, setSearch] = useState('');
  
  const toggleOption = (opt: string) => {
    if (single) {
        onChange(opt);
        onClose();
    } else {
        const safeValue = Array.isArray(value) ? value : [];
        const newValue = safeValue.includes(opt) ? safeValue.filter((v: string) => v !== opt) : [...safeValue, opt];
        onChange(newValue);
    }
  };

  const createOption = () => {
    if (search && !options.includes(search)) {
      onCreate(search);
      if (single) {
          onChange(search);
          onClose();
      } else {
          const safeValue = Array.isArray(value) ? value : [];
          onChange([...safeValue, search]);
      }
      setSearch('');
    }
  };

  const filtered = options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()));

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
  ];
  
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const isSelected = (opt: string) => {
      if (single) return value === opt;
      return Array.isArray(value) && value.includes(opt);
  }

  return (
    <div className="w-[260px] bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="p-2 border-b border-zinc-700">
        <input 
          autoFocus
          className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none placeholder:text-zinc-500"
          placeholder="Search or create..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        {search && !options.includes(search) && (
          <button onClick={createOption} className="w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded flex items-center gap-2">
            Create new one... <span className="text-white font-bold">"{search}"</span>
          </button>
        )}
        <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase">Choose an option or create one</div>
        {filtered.map((opt: string) => (
          <button 
            key={opt} 
            onClick={() => toggleOption(opt)}
            className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center justify-between group"
          >
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-black ${getTagColor(opt)}`}>{opt}</span>
            {isSelected(opt) && <Check size={12} className="text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

const PersonSelector = ({ value, onChange, onClose }: any) => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_PROFILES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-[260px] bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="p-2 border-b border-zinc-700">
        <input 
          autoFocus
          className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none placeholder:text-zinc-500"
          placeholder="Search people..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
        {filtered.map(p => (
          <button 
            key={p.id}
            onClick={() => { onChange(p.name); onClose(); }}
            className={`w-full flex items-center gap-3 px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors ${value === p.name ? 'bg-blue-600/20' : ''}`}
          >
            <img src={p.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
            <span className={`text-xs ${value === p.name ? 'text-blue-400 font-bold' : 'text-zinc-300'}`}>{p.name}</span>
            {value === p.name && <Check size={12} className="ml-auto text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

const TextSettingsPopup = ({ block, onChange, onClose, position, onOpenColorPicker }: { block: PageBlock | null, onChange: (updates: any) => void, onClose: () => void, position: { x: number, y: number }, onOpenColorPicker: (rect: DOMRect) => void }) => {
  const p = block?.properties || {};
  
  const updateProp = (key: string, value: any) => {
    onChange({ properties: { ...p, [key]: value } });
  };

  const toggleProp = (key: string) => {
    updateProp(key, !p[key]);
  };

  const colors = ['#ffffff', '#000000', '#3b82f6', '#8b5cf6', '#06b6d4', '#eab308', '#22c55e', '#ef4444'];

  return (
    <div 
      className="fixed z-[9999] w-[320px] bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out origin-top-left ring-1 ring-white/5"
      style={{ top: Math.max(20, position.y), left: position.x }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <TypeIcon size={12} /> Typography
        </h3>
        <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={14} /></button>
      </div>

      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
        <div className="space-y-2.5">
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Font Family</label>
           <div className="relative group">
             <select 
               value={p.fontFamily || 'Inter'}
               onChange={(e) => updateProp('fontFamily', e.target.value)}
               className="w-full bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer hover:border-zinc-700"
             >
               {AVAILABLE_FONTS.map(font => (
                 <option key={font} value={font}>{font}</option>
               ))}
             </select>
             <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300 transition-colors" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Weight</label>
              <div className="relative group">
                <select 
                  value={p.fontWeight || 'normal'}
                  onChange={(e) => updateProp('fontWeight', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer hover:border-zinc-700"
                >
                  <option value="normal">Regular</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Light</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300 transition-colors" />
              </div>
           </div>
           <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Size (px)</label>
              <div className="relative group flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
                 <input 
                   type="number"
                   value={parseInt(String(p.fontSize || (block?.type === 'heading' ? '32' : '16')))}
                   onChange={(e) => updateProp('fontSize', e.target.value + 'px')}
                   className="w-full bg-transparent text-zinc-200 text-xs font-bold py-3 px-4 outline-none"
                 />
                 <div className="flex flex-col gap-0.5 pr-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    <button className="hover:text-white text-zinc-500" onClick={() => updateProp('fontSize', (parseInt(String(p.fontSize || '16')) + 1) + 'px')}><ChevronDown size={10} className="rotate-180" /></button>
                    <button className="hover:text-white text-zinc-500" onClick={() => updateProp('fontSize', (parseInt(String(p.fontSize || '16')) - 1) + 'px')}><ChevronDown size={10} /></button>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Color</label>
              <div className="w-5 h-5 rounded-full border border-white/10 shadow-sm" style={{ background: p.color || '#ffffff' }} />
           </div>
           <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 px-1">
              <button 
                className="w-9 h-9 rounded-full shrink-0 outline-none hover:ring-2 hover:ring-white/50 transition-all shadow-md hover:scale-110 p-0 border border-white/10" 
                style={{ background: 'conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #000000, #ff00ff, #ff0000)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenColorPicker(e.currentTarget.getBoundingClientRect());
                }}
                title="Custom Color"
              />
              {colors.map(c => (
                 <button 
                   key={c}
                   onClick={() => updateProp('color', c)}
                   className={`w-9 h-9 rounded-full border shrink-0 transition-all shadow-sm ${
                     p.color === c 
                     ? 'border-white scale-110 ring-2 ring-white/20' 
                     : 'border-transparent hover:scale-110 hover:border-white/30'
                   }`}
                   style={{ backgroundColor: c }}
                 />
              ))}
           </div>
        </div>

        <div className="h-px bg-white/5 w-full" />

        <div className="space-y-2.5">
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Style</label>
           <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
              {[
                { key: 'heading', val: 'h1', icon: <span className="font-black text-[10px]">H1</span>, active: p.heading === 'h1' },
                { key: 'isBold', val: true, icon: <Bold size={14}/>, active: p.isBold },
                { key: 'isItalic', val: true, icon: <Underline size={14}/>, active: p.isItalic },
                { key: 'isUnderline', val: true, icon: <Underline size={14}/>, active: p.isUnderline }
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => item.key === 'heading' ? updateProp('heading', item.active ? null : 'h1') : toggleProp(item.key)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${item.active ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                >
                  {item.icon}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Alignment</label>
           <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
              {['left', 'center', 'right', 'justify'].map(a => (
                 <button 
                   key={a}
                   onClick={() => updateProp('align', a)}
                   className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${p.align === a ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                 >
                    {a === 'left' && <AlignLeft size={14}/>}
                    {a === 'center' && <AlignCenter size={14}/>}
                    {a === 'right' && <AlignRight size={14}/>}
                    {a === 'justify' && <AlignJustify size={14}/>}
                 </button>
              ))}
           </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-white/5">
           <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Line Height</label>
              <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700 transition-all">
                 <span className="text-[10px] font-bold text-zinc-300 font-mono">{p.lineHeight || 1.5}</span>
              </div>
           </div>
           
           <div className="relative h-5 flex items-center group cursor-pointer">
              <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden group-hover:bg-zinc-700 transition-colors duration-300">
                 <div 
                   className="h-full bg-blue-500 rounded-full transition-all duration-150 ease-out" 
                   style={{ width: `${((p.lineHeight || 1.5) - 1) / (3 - 1) * 100}%` }}
                 />
              </div>
              
              <input 
                type="range" min="1" max="3" step="0.1"
                value={p.lineHeight || 1.5}
                onChange={(e) => updateProp('lineHeight', parseFloat(e.target.value))}
                className="
                  relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10
                  focus:outline-none
                "
              />
           </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedColorPicker: React.FC<{ color: string, onChange: (color: string) => void, onClose: () => void, hideSolid?: boolean }> = ({ color, onChange, onClose, hideSolid }) => {
  const isGradient = color.startsWith('linear-gradient');
  
  const [mode, setMode] = useState<'SOLID' | 'GRADIENT'>(hideSolid ? 'GRADIENT' : (isGradient ? 'GRADIENT' : 'SOLID'));
  
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState(['#ffffff', '#000000']);
  const [activeStop, setActiveStop] = useState(0);

  const [hsv, setHsv] = useState(hexToHsv(isGradient ? '#ffffff' : color));
  const [hexInput, setHexInput] = useState(isGradient ? '#ffffff' : color);
  const [alpha, setAlpha] = useState(100);
  
  const areaRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef(hsv);

  useEffect(() => { hsvRef.current = hsv; }, [hsv]);

  useEffect(() => {
    if (color.startsWith('linear-gradient')) {
      setMode('GRADIENT');
      try {
        const match = color.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
        if (match) {
          setAngle(parseInt(match[1]));
          const rawStops = match[2].split(',').map(s => s.trim());
          const colors = rawStops.map(s => {
             const hexMatch = s.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
             return hexMatch ? hexMatch[0] : '#ffffff';
          });
          
          if (colors.length >= 2) {
             setStops(colors);
             const currentStopColor = colors[activeStop] || colors[0];
             setHsv(hexToHsv(currentStopColor));
             setHexInput(currentStopColor);
          }
        }
      } catch (e) { console.error("Gradient parse error", e); }
    } else {
      setMode(hideSolid ? 'GRADIENT' : 'SOLID');
      setStops([color, color]);
      setHsv(hexToHsv(color));
      setHexInput(color);
    }
  }, [color]);

  useEffect(() => {
    if (mode === 'GRADIENT') {
      const c = stops[activeStop];
      setHsv(hexToHsv(c));
      setHexInput(c);
    }
  }, [activeStop]);

  const updateCurrentColor = (newHsv: {h: number, s: number, v: number}) => {
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newHex);

    if (mode === 'SOLID') {
      onChange(newHex);
    } else {
      const newStops = [...stops];
      newStops[activeStop] = newHex;
      setStops(newStops);
      onChange(`linear-gradient(${angle}deg, ${newStops[0]} 0%, ${newStops[1]} 100%)`);
    }
  };

  const updateAngle = (newAngle: number) => {
    setAngle(newAngle);
    onChange(`linear-gradient(${newAngle}deg, ${stops[0]} 0%, ${stops[1]} 100%)`);
  };

  const handleAreaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (ev: MouseEvent) => {
      if (!areaRef.current) return;
      const rect = areaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      
      const currentH = hsvRef.current.h;
      updateCurrentColor({ h: currentH, s: x * 100, v: (1 - y) * 100 });
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    handleMouseMove(e.nativeEvent);
  };

  const presets = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', 
    '#71717a', '#a1a1aa', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'
  ];

  return (
    <div className="w-[320px] bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <style>{`
         input[type=range].custom-slider {
            -webkit-appearance: none;
            background: transparent;
         }
         input[type=range].custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 18px;
            width: 8px;
            border-radius: 4px;
            background: #ffffff;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 2px 5px rgba(0,0,0,0.4);
            cursor: pointer;
            border: none;
            transition: transform 0.1s;
            margin-top: 0px; 
         }
         input[type=range].custom-slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            background: #f4f4f5;
         }
         input[type=range].custom-slider:focus {
            outline: none;
         }
      `}</style>
      
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
         <div className="flex bg-black/40 p-1 rounded-xl w-full border border-white/5">
            {!hideSolid && (
                <button 
                onClick={() => {
                    setMode('SOLID');
                    onChange(stops[0]); 
                }}
                className={`flex-1 py-1.5 text-[10px] font-black tracking-widest rounded-lg transition-all ${mode === 'SOLID' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                SOLID
                </button>
            )}
            <button 
              onClick={() => {
                setMode('GRADIENT');
                onChange(`linear-gradient(${angle}deg, ${stops[0]} 0%, ${stops[1]} 100%)`);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black tracking-widest rounded-lg transition-all ${mode === 'GRADIENT' || hideSolid ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              GRADIENT
            </button>
         </div>
         <button onClick={onClose} className="p-2 ml-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={14} />
         </button>
      </div>

      <div className="p-4 space-y-5">
        
        {mode === 'GRADIENT' && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
             <div className="h-10 w-full rounded-xl relative border border-white/10 cursor-pointer shadow-inner ring-1 ring-black/20" 
                  style={{ background: `linear-gradient(${angle}deg, ${stops[0]} 0%, ${stops[1]} 100%)` }}>
                <div 
                  onClick={() => setActiveStop(0)}
                  className={`absolute top-1/2 -translate-y-1/2 left-2 w-4 h-6 rounded-[4px] border-2 shadow-lg transition-transform hover:scale-110 ${activeStop === 0 ? 'border-white scale-110 ring-2 ring-blue-500 z-10' : 'border-zinc-400 z-0'}`}
                  style={{ backgroundColor: stops[0] }}
                />
                <div 
                  onClick={() => setActiveStop(1)}
                  className={`absolute top-1/2 -translate-y-1/2 right-2 w-4 h-6 rounded-[4px] border-2 shadow-lg transition-transform hover:scale-110 ${activeStop === 1 ? 'border-white scale-110 ring-2 ring-blue-500 z-10' : 'border-zinc-400 z-0'}`}
                  style={{ backgroundColor: stops[1] }}
                />
             </div>
             
             <div className="flex items-center gap-3">
                <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400"><RotateCw size={12} /></div>
                <input 
                  type="range" min="0" max="360" 
                  value={angle} 
                  onChange={(e) => updateAngle(parseInt(e.target.value))}
                  className="custom-slider flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">{angle}°</span>
             </div>
          </div>
        )}

        <div 
          ref={areaRef}
          onMouseDown={handleAreaMouseDown}
          className="relative h-40 w-full rounded-xl cursor-crosshair shadow-2xl ring-1 ring-white/10 overflow-hidden"
          style={{
            backgroundColor: hsvToHex(hsv.h, 100, 100),
            backgroundImage: `
              linear-gradient(to top, #000, transparent), 
              linear-gradient(to right, #fff, transparent)
            `
          }}
        >
          <div 
            className="absolute w-4 h-4 rounded-[4px] border-2 border-white shadow-[0_2px_5px_rgba(0,0,0,0.5)] -ml-2 -mt-2 pointer-events-none transform transition-transform"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              backgroundColor: hsvToHex(hsv.h, hsv.s, hsv.v)
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="range" min="0" max="360" 
              value={hsv.h}
              onChange={(e) => updateCurrentColor({...hsv, h: parseFloat(e.target.value)})}
              className="custom-slider flex-1 h-3 rounded-full appearance-none cursor-pointer outline-none border border-white/5 shadow-inner"
              style={{
                background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
              }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full relative overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADWF768AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHJJREFUeNpi/P///38GwsD/////Gf6D2QxQjQxQjQxQjQxQjQxQjQxQjQxQjQxQjQxQjQxQjQwAAgwA+oan2Tz7jyoAAAAASUVORK5CYII=')] border border-white/5 shadow-inner">
              <input 
                type="range" min="0" max="100" 
                value={alpha}
                onChange={(e) => setAlpha(parseInt(e.target.value))}
                className="custom-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, transparent, ${hsvToHex(hsv.h, hsv.s, hsv.v)})`
                }}
              />
              <div 
                className="absolute h-full w-2 bg-white rounded-[2px] top-0 pointer-events-none shadow-md border border-zinc-200 transition-transform duration-100 ease-out"
                style={{ left: `${alpha}%`, transform: 'translateX(-50%)', height: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl flex items-center px-3 py-2.5 transition-colors focus-within:border-blue-500 hover:border-zinc-600">
            <span className="text-zinc-500 text-xs mr-2 font-mono">#</span>
            <input 
              value={hexInput.replace('#','')}
              onChange={(e) => {
                const val = e.target.value;
                setHexInput('#' + val);
                if (/^[0-9A-F]{6}$/i.test(val)) {
                  updateCurrentColor(hexToHsv('#' + val));
                }
              }}
              className="bg-transparent text-white text-xs font-bold w-full outline-none uppercase font-mono tracking-widest"
            />
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider ml-1">HEX</span>
          </div>
          <div className="w-24 bg-black/40 border border-white/10 rounded-xl flex items-center px-3 py-2.5 transition-colors focus-within:border-blue-500 hover:border-zinc-600">
            <input 
              value={alpha}
              onChange={(e) => setAlpha(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="bg-transparent text-white text-xs font-bold w-full outline-none text-center"
            />
            <span className="text-[9px] font-black text-zinc-600 ml-1">%</span>
          </div>
        </div>

        <div className="grid grid-cols-9 gap-2">
          {presets.map(c => (
            <button 
              key={c}
              onClick={() => updateCurrentColor(hexToHsv(c))}
              className="aspect-square rounded-lg border border-white/5 hover:scale-110 transition-transform shadow-sm ring-1 ring-transparent hover:ring-white/20"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#18181b]">
        <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 hover:text-white transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20">
          Save
        </button>
      </div>
    </div>
  );
};

const getBannerStyle = (variant: string) => {
  switch(variant) {
    case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
    case 'error': return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
    case 'neutral': return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
    case 'purple': return 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400';
    case 'pink': return 'bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400';
    case 'indigo': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
    case 'teal': return 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400';
    case 'orange': return 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400';
    default: return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'; // Info
  }
};

const getBannerIcon = (variant: string) => {
  switch(variant) {
    case 'success': return <CheckCircle2 size={20} />;
    case 'warning': return <AlertTriangle size={20} />;
    case 'error': return <XCircle size={20} />;
    case 'neutral': return <Info size={20} />;
    case 'purple': return <Star size={20} />;
    case 'pink': return <Flame size={20} />;
    case 'indigo': return <Bell size={20} />;
    case 'teal': return <Check size={20} />;
    case 'orange': return <Zap size={20} />;
    default: return <Info size={20} />;
  }
};

const getColumnIcon = (type: string) => {
  switch (type) {
    case 'text': return <TypeIcon size={14} className="text-slate-400" />;
    case 'number': return <NumberIcon size={14} className="text-slate-400" />;
    case 'select': return <ChevronDownCircle size={14} className="text-slate-400" />;
    case 'multi-select': return <ListChecks size={14} className="text-slate-400" />;
    case 'date': return <CalendarDays size={14} className="text-slate-400" />;
    case 'person': return <User size={14} className="text-slate-400" />;
    case 'checkbox': return <CheckSquare size={14} className="text-slate-400" />;
    default: return <TypeIcon size={14} className="text-slate-400" />;
  }
};

const DatabaseTable = ({ block, isSelected, onChange }: { block: PageBlock, isSelected: boolean, onChange: (b: PageBlock) => void }) => {
  const [data, setData] = useState<{ columns: any[], rows: any[] }>(() => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        if (parsed && typeof parsed === 'object' && parsed.columns && parsed.rows) return parsed;
      } catch(e) {
        console.error("Error parsing database table content", e);
      }
    }
    // Reset to generic empty state
    return {
      columns: [
        { id: 'c1', name: 'Property', type: 'text', width: 250 },
      ],
      rows: [
        { id: 'r1', c1: '' },
      ]
    };
  });

  const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string, anchorEl: HTMLElement } | null>(null);
  const [editingProp, setEditingProp] = useState<any>(null); // For column editing modal
  const [addColumnPopup, setAddColumnPopup] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (JSON.stringify(data) !== block.content) {
        onChange({ ...block, content: JSON.stringify(data) });
    }
  }, [data]);

  const addColumn = (type: string) => {
    const newColId = `c${Date.now()}`;
    setData(prev => ({
      ...prev,
      columns: [...prev.columns, { id: newColId, name: `New ${type}`, type: type, width: 150 }],
      rows: prev.rows.map(r => ({ ...r, [newColId]: type === 'checkbox' ? false : (type === 'multi-select' ? [] : '') }))
    }));
    setAddColumnPopup(null);
  };

  const addRow = () => {
    const newRowId = `r${Date.now()}`;
    const newRow: any = { id: newRowId };
    data.columns.forEach(c => newRow[c.id] = c.type === 'checkbox' ? false : (c.type === 'multi-select' ? [] : ''));
    setData(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const updateCell = (rowId: string, colId: string, value: any) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === rowId ? { ...r, [colId]: value } : r)
    }));
  };

  const createOption = (colId: string, option: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, options: [...(c.options || []), option] } : c)
    }));
  };

  const deleteColumn = (colId: string) => {
    setData(prev => ({
      columns: prev.columns.filter(c => c.id !== colId),
      rows: prev.rows.map(r => {
        const { [colId]: deleted, ...rest } = r;
        return rest;
      })
    }));
    setEditingProp(null);
  };

  const updateColumn = (colId: string, updates: any) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? updates : c)
    }));
  };

  const handleCellClick = (e: React.MouseEvent, rowId: string, colId: string, type: string) => {
    if (type === 'checkbox') {
      const row = data.rows.find(r => r.id === rowId);
      updateCell(rowId, colId, !row[colId]);
    } else if (['multi-select', 'select', 'date', 'person'].includes(type)) {
      setActiveCell({ rowId, colId, anchorEl: e.currentTarget as HTMLElement });
    }
  };

  // Expanded Random Colors
  const tagColors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
  ];
  
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return tagColors[Math.abs(hash) % tagColors.length];
  };

  const handleAddPropertyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setAddColumnPopup({ x: rect.left, y: rect.bottom + 4 });
  };

  return (
    <div className="w-full relative group/table overflow-visible">
      {/* Add Property Popup Matching Screenshot */}
      {addColumnPopup && createPortal(
        <div 
          className="fixed z-[10005] w-[260px] bg-[#222228] border border-zinc-700/50 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ top: addColumnPopup.y, left: addColumnPopup.x - 180 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 bg-white/5">
             <h4 className="text-sm font-black text-white/90">Add Property</h4>
             <button onClick={() => setAddColumnPopup(null)} className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 transition-colors"><X size={16}/></button>
          </div>
          <div className="h-px bg-white/10 mx-4" />
          <div className="p-2 space-y-0.5">
             {[
               { id: 'text', label: 'Text', icon: TypeIcon },
               { id: 'number', label: 'Number', icon: NumberIcon },
               { id: 'select', label: 'Select', icon: ChevronDownCircle },
               { id: 'multi-select', label: 'Multi Select', icon: ListChecks },
               { id: 'date', label: 'Date', icon: CalendarDays },
               { id: 'person', label: 'Person', icon: User },
               { id: 'checkbox', label: 'Checkbox', icon: CheckSquare }
             ].map(type => (
               <button 
                 key={type.id}
                 onClick={() => addColumn(type.id)}
                 className="w-full flex items-center gap-4 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all group/opt text-left"
               >
                 <div className="p-1.5 bg-white/5 rounded-lg text-zinc-400 group-hover/opt:text-white transition-colors">
                   <type.icon size={18} />
                 </div>
                 <span className="text-sm font-bold text-zinc-300 group-hover/opt:text-white transition-colors">{type.label}</span>
               </button>
             ))}
          </div>
        </div>,
        document.body
      )}

      {/* Edit Property Modal */}
      {editingProp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingProp(null)}>
           <div className="bg-[#18181b] border border-zinc-700 w-80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                 <h4 className="text-xs font-bold text-white">Edit Property</h4>
                 <button onClick={() => setEditingProp(null)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
              </div>
              <div className="p-4 space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Field Name</label>
                    <input 
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-600"
                      value={editingProp.name}
                      onChange={(e) => setEditingProp({...editingProp, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['text', 'number', 'select', 'multi-select', 'date', 'person', 'checkbox'].map(t => (
                          <button 
                            key={t}
                            onClick={() => setEditingProp({...editingProp, type: t})}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${editingProp.type === t ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          >
                             {getColumnIcon(t)} {t}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="pt-2 flex gap-2">
                    <button onClick={() => deleteColumn(editingProp.id)} className="flex-1 py-2 border border-rose-900/50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-900/20">Delete</button>
                    <button 
                      onClick={() => { updateColumn(editingProp.id, editingProp); setEditingProp(null); }}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                       Save
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Cell Popovers */}
      {activeCell && (
        <div 
          className="fixed z-[9999]"
          style={{ 
            top: activeCell.anchorEl.getBoundingClientRect().bottom + 4, 
            left: activeCell.anchorEl.getBoundingClientRect().left 
          }}
        >
          {(() => {
            const col = data.columns.find(c => c.id === activeCell.colId);
            const row = data.rows.find(r => r.id === activeCell.rowId);
            if (!col || !row) return null;

            if (col.type === 'multi-select' || col.type === 'select') {
              const isMulti = col.type === 'multi-select';
              const currentValue = isMulti 
                  ? (Array.isArray(row[col.id]) ? row[col.id] : []) 
                  : row[col.id]; // For select it's just the string value
              return (
                <OptionSelectEditor 
                  options={col.options || []} 
                  value={currentValue}
                  onChange={(val: any) => updateCell(activeCell.rowId, activeCell.colId, val)}
                  onCreate={(opt: string) => createOption(col.id, opt)}
                  onClose={() => setActiveCell(null)}
                  single={!isMulti}
                />
              );
            }
            if (col.type === 'date') {
              return (
                <CustomCalendar 
                  value={row[col.id]} 
                  onChange={(date) => updateCell(activeCell.rowId, activeCell.colId, date)}
                  onClose={() => setActiveCell(null)}
                />
              );
            }
            if (col.type === 'person') {
              return (
                <PersonSelector 
                  value={row[col.id]}
                  onChange={(person: string) => updateCell(activeCell.rowId, activeCell.colId, person)}
                  onClose={() => setActiveCell(null)}
                />
              );
            }
            return null;
          })()}
          <div className="fixed inset-0 z-[-1]" onClick={() => setActiveCell(null)} />
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {data.columns.map((col: any) => (
                <th key={col.id} className="text-left font-normal text-zinc-500 dark:text-zinc-400 p-0 relative group/th" style={{ width: col.width }}>
                   <div 
                     className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors h-full"
                     onClick={() => setEditingProp(col)}
                   >
                      {getColumnIcon(col.type)}
                      <span className="text-xs font-bold flex-1 truncate select-none">{col.name}</span>
                   </div>
                </th>
              ))}
              <th className="w-10 p-0 border-l border-zinc-200 dark:border-zinc-800">
                 <button onClick={handleAddPropertyClick} className="w-full h-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 transition-colors py-2.5">
                    <Plus size={14} />
                 </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.rows.map((row: any) => (
              <tr key={row.id} className="group/tr">
                {data.columns.map((col: any) => (
                  <td 
                    key={col.id} 
                    className="p-0 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 relative hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    onClick={(e) => handleCellClick(e, row.id, col.id, col.type)}
                  >
                     {col.type === 'checkbox' ? (
                        <div className="flex items-center justify-center h-full py-2">
                           <RippleCheckbox checked={row[col.id] === true} onChange={(val) => updateCell(row.id, col.id, val)} />
                        </div>
                     ) : col.type === 'number' ? (
                        <div className="relative group/num h-full">
                           <input 
                             type="number"
                             className="w-full h-full bg-transparent px-3 py-2.5 outline-none text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                             value={row[col.id]}
                             onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                             placeholder="0"
                           />
                           <div className="absolute right-1 top-1 bottom-1 w-5 flex flex-col opacity-0 group-hover/num:opacity-100 transition-opacity bg-zinc-800 rounded border border-zinc-700 z-10">
                              <button 
                                type="button"
                                className="h-1/2 flex items-center justify-center hover:bg-zinc-700 text-zinc-400" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentVal = parseFloat(row[col.id] || '0');
                                    updateCell(row.id, col.id, (currentVal + 1).toString());
                                }}
                              >
                                <ChevronDown className="rotate-180" size={10}/>
                              </button>
                              <button 
                                type="button"
                                className="h-1/2 flex items-center justify-center hover:bg-zinc-700 text-zinc-400" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentVal = parseFloat(row[col.id] || '0');
                                    updateCell(row.id, col.id, (currentVal - 1).toString());
                                }}
                              >
                                <ChevronDown size={10}/>
                              </button>
                           </div>
                        </div>
                     ) : col.type === 'multi-select' ? (
                        <div className="px-3 py-2.5 h-full cursor-pointer flex flex-wrap gap-1">
                           {(Array.isArray(row[col.id]) ? row[col.id] : []).map((tag: string) => (
                              <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold text-black ${getTagColor(tag)}`}>{tag}</span>
                           ))}
                           {(!row[col.id] || (Array.isArray(row[col.id]) && row[col.id].length === 0)) && <span className="text-zinc-500 text-xs italic">Empty</span>}
                        </div>
                     ) : col.type === 'select' ? (
                        <div className="px-3 py-2.5 h-full cursor-pointer flex items-center">
                           {row[col.id] ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-black ${getTagColor(row[col.id])}`}>{row[col.id]}</span>
                           ) : <span className="text-zinc-500 text-xs italic">Empty</span>}
                        </div>
                     ) : col.type === 'person' ? (
                        <div className="flex items-center gap-2 px-3 py-2 h-full cursor-pointer">
                           {row[col.id] ? (
                             <>
                               <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                  <img src={MOCK_PROFILES.find(p => p.name === row[col.id])?.avatar || `https://i.pravatar.cc/150?u=${row[col.id]}`} className="w-full h-full object-cover" alt="" />
                               </div>
                               <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{row[col.id]}</span>
                             </>
                           ) : <span className="text-zinc-500 text-xs italic">Select person</span>}
                        </div>
                     ) : col.type === 'date' ? (
                        <div className="px-3 py-2.5 h-full cursor-pointer text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center">
                           {row[col.id] ? (
                             <>
                               {(() => {
                                   const val = String(row[col.id]);
                                   const parts = val.split('-');
                                   if(parts.length === 3) {
                                       const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                       return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                                   }
                                   return val;
                               })()}
                             </>
                           ) : <span className="text-zinc-500 italic">MM/DD/YYYY</span>}
                        </div>
                     ) : (
                       <input 
                         type="text"
                         className="w-full h-full bg-transparent px-3 py-2.5 outline-none text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500"
                         value={row[col.id]}
                         onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                         placeholder="Empty"
                       />
                     )}
                  </td>
                ))}
                <td className="bg-zinc-50 dark:bg-zinc-900/50" />
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          onClick={addRow}
          className="w-full py-2.5 flex items-center gap-2 px-3 text-xs font-bold text-slate-500 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border-t border-zinc-200 dark:border-zinc-800"
        >
           <Plus size={14} /> Add new row
        </button>
      </div>
    </div>
  );
};

const CarouselSlider = ({ items }: { items: string[] }) => {
  const [index, setIndex] = useState(0);
  
  if (items.length === 0) return null;
  
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % items.length);
  };
  
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="w-full h-64 bg-black rounded-[2rem] overflow-hidden relative group/slider">
        <img src={items[index]} className="w-full h-full object-cover opacity-90 transition-opacity duration-500" alt=""/>
        <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover/slider:opacity-100 transition-opacity">
            <button 
                onClick={prev}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
            >
                <ChevronLeftSquare size={24}/>
            </button>
            <button 
                onClick={next}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
            >
                <ChevronRightSquare size={24}/>
            </button>
        </div>
        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`} 
                />
            ))}
        </div>
    </div>
  );
};

const BlockRenderer: React.FC<{ block: PageBlock, isSelected: boolean, onClick: (e: React.MouseEvent) => void, onChange: (b: PageBlock) => void, onDelete: () => void, settings: any, onOpenColorPicker?: (rect: DOMRect) => void, onOpenSettings?: (rect: DOMRect) => void, onOpenLink?: (rect: DOMRect) => void }> = ({ block, isSelected, onClick, onChange, onDelete, settings, onOpenColorPicker, onOpenSettings, onOpenLink }) => {
  const [localContent, setLocalContent] = useState(block.content);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isButtonMenuOpen, setIsButtonMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLocalContent(block.content), [block.content]);
  
  // Close button menu when block is deselected
  useEffect(() => {
    if (!isSelected) setIsButtonMenuOpen(false);
  }, [isSelected]);

  const handleContentBlur = () => {
    if (localContent !== block.content) onChange({ ...block, content: localContent });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
       const result = ev.target?.result as string;
       if (block.type === 'image') {
          onChange({ ...block, content: result });
       } else if (block.type === 'upload') {
          const meta = {
             name: file.name,
             size: (file.size / 1024).toFixed(2) + ' KB',
             type: file.type,
             url: result 
          };
          onChange({ ...block, content: JSON.stringify(meta) });
       } else if (block.type === 'carousel') {
          let items = [];
          try { items = JSON.parse(block.content); } catch(e) {
            console.error("Error parsing carousel items", e);
          }
          const newItems = [...items, result];
          onChange({ ...block, content: JSON.stringify(newItems) });
       }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUrlSubmit = () => {
    if (videoUrlInput) {
        onChange({ ...block, content: videoUrlInput });
        setVideoUrlInput('');
    }
  };

  const commonClasses = `relative group transition-all duration-200 rounded-lg border-2 ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/10 z-10' : 'border-transparent hover:border-zinc-700'}`;

  const richStyle: React.CSSProperties = {
    lineHeight: block.properties?.lineHeight || settings.lineSpacing,
    color: block.properties?.color || settings.textColor,
    backgroundColor: block.properties?.backgroundColor,
    textAlign: block.properties?.align as any,
    fontFamily: block.properties?.fontFamily,
    fontWeight: block.properties?.fontWeight,
    fontSize: block.properties?.fontSize,
    fontStyle: block.properties?.isItalic ? 'italic' : 'normal',
    textDecoration: block.properties?.isUnderline ? 'underline' : 'none',
  };

  return (
    <div 
        className={`${commonClasses} ${block.properties?.hideOnMobile ? 'hidden sm:block' : ''}`} 
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        style={block.type === 'button' ? { marginTop: `${block.properties?.bannerSpacing || 0}px`, marginBottom: `${block.properties?.bannerSpacing || 0}px` } : {}}
    >
      {isSelected && block.type !== 'button' && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
           <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 bg-zinc-800 text-rose-500 rounded-lg shadow-lg hover:bg-rose-900/20"><Trash2 size={14} /></button>
           <button className="p-2 bg-zinc-800 text-zinc-400 cursor-move rounded-lg shadow-lg"><GripVertical size={14} /></button>
        </div>
      )}

      {block.type === 'heading' && (
        <input 
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleContentBlur}
          style={richStyle}
          className={`w-full bg-transparent outline-none ${!block.properties?.fontSize ? (block.properties?.size === 'xl' ? 'text-4xl md:text-6xl font-black' : block.properties?.size === 'lg' ? 'text-3xl md:text-4xl font-bold' : 'text-2xl font-bold') : ''}`}
          placeholder="Heading..."
        />
      )}

      {block.type === 'text' && (
        <textarea 
          value={localContent}
          onChange={(e) => { 
             setLocalContent(e.target.value); 
             e.target.style.height = 'auto'; 
             e.target.style.height = e.target.scrollHeight + 'px'; 
          }}
          onBlur={handleContentBlur}
          style={richStyle}
          className="w-full bg-transparent outline-none resize-none overflow-hidden"
          placeholder="Type something..."
          rows={1}
        />
      )}

      {block.type === 'button' && (
        <div className={`w-full flex flex-col ${block.properties?.align === 'center' ? 'items-center' : block.properties?.align === 'right' ? 'items-end' : 'items-start'} py-4`}>
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {isButtonMenuOpen && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest text-center">Settings</p>
                    <div className="flex items-center gap-3 justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                          className="w-10 h-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
                        >
                            <GearIcon size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (onOpenLink) onOpenLink(e.currentTarget.getBoundingClientRect()); }}
                          className="w-10 h-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
                        >
                            <LinkIcon size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(block.properties?.url || '#', block.properties?.openInNewTab ? '_blank' : '_self'); }}
                          className="w-10 h-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
                        >
                            <ExternalLink size={18} />
                        </button>
                    </div>
                </div>
             )}

             <div className="flex items-center gap-4 group/btn-inner">
                {isSelected && (
                    <button className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-move">
                        <SlidersHorizontal size={20}/>
                    </button>
                )}
                
                <button 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (block.properties?.url) {
                            window.open(block.properties.url, block.properties.openInNewTab ? '_blank' : '_self');
                        }
                    }}
                    className="px-8 py-3 rounded-full font-bold text-white shadow-xl transition-all transform flex items-center justify-center gap-3"
                    style={{ 
                        background: isHovered ? (block.properties?.hoverButtonColor || block.properties?.buttonColor || '#2563eb') : (block.properties?.buttonColor || '#2563eb'), 
                        color: isHovered ? (block.properties?.hoverTextColor || block.properties?.textColor || 'white') : (block.properties?.textColor || 'white'), 
                        width: block.properties?.customize ? (block.properties?.width || '100%') : 'auto',
                        borderRadius: `${block.properties?.borderRadius || 30}px`,
                        border: `${block.properties?.borderWidth || '0px'} ${(block.properties?.borderStyle || 'solid').toLowerCase()} ${isHovered ? (block.properties?.hoverBorderColor || block.properties?.borderColor || 'transparent') : (block.properties?.borderColor || 'transparent')}`,
                        fontSize: `${block.properties?.fontSize || 16}px`,
                        fontFamily: block.properties?.fontFamily || 'Inter',
                        scale: isHovered ? '1.02' : '1',
                        cursor: block.properties?.url ? 'pointer' : 'default'
                    }}
                >
                    {block.properties?.iconPosition === 'Start' && block.properties?.selectedIcon && AVAILABLE_ICONS[block.properties.selectedIcon] && (
                        React.createElement(AVAILABLE_ICONS[block.properties.selectedIcon], { size: parseInt(String(block.properties?.fontSize || 16)) + 2 })
                    )}
                    {block.properties?.buttonText || 'Button'}
                    {block.properties?.iconPosition === 'End' && block.properties?.selectedIcon && AVAILABLE_ICONS[block.properties.selectedIcon] && (
                        React.createElement(AVAILABLE_ICONS[block.properties.selectedIcon], { size: parseInt(String(block.properties?.fontSize || 16)) + 2 })
                    )}
                </button>

                {isSelected && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsButtonMenuOpen(!isButtonMenuOpen); }}
                      className={`p-2 rounded-lg transition-all ${isButtonMenuOpen ? 'bg-blue-600 text-white' : 'text-blue-500 hover:bg-blue-500/10'}`}
                    >
                        <DotsVertical size={20}/>
                    </button>
                )}
             </div>
          </div>
        </div>
      )}

      {block.type === 'image' && (
        <div className={`rounded-2xl overflow-hidden relative min-h-[200px] flex items-center justify-center ${block.properties?.align === 'center' ? 'mx-auto' : ''}`}>
           {localContent ? (
             <div className="relative group/img w-full">
               <img src={localContent} className="w-full h-full object-cover rounded-2xl" alt="" />
               {isSelected && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                   className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                 >
                   Replace
                 </button>
               )}
             </div>
           ) : (
             <div 
               onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
               className="flex flex-col items-center gap-3 text-zinc-500 bg-zinc-900/50 w-full h-64 justify-center rounded-2xl border-2 border-dashed border-zinc-800 cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group/ph"
             >
               <div className="p-4 bg-zinc-800 rounded-full group-hover/ph:scale-110 transition-transform">
                 <ImageIcon size={32} className="text-zinc-400" />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover/ph:text-white">Add Image</span>
             </div>
           )}
        </div>
      )}

      {block.type === 'video' && (
        <div className="w-full rounded-2xl overflow-hidden min-h-[100px]">
           {localContent ? (
             <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group/vid">
               <iframe src={localContent.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} className="w-full h-full" frameBorder="0" allowFullScreen title="Video" />
               {isSelected && (
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onChange({...block, content: ''}); }} className="px-4 py-2 bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-lg">Change Video</button>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 bg-zinc-900/50 w-full h-64 justify-center rounded-2xl border-2 border-dashed border-zinc-800 p-8">
               <div className="p-4 bg-zinc-800 rounded-full"><Youtube size={32} className="text-zinc-400" /></div>
               <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                 <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Embed Video URL</span>
                 <div className="flex w-full gap-2">
                   <input type="text" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="YouTube / Vimeo URL..." value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') handleVideoUrlSubmit(); }} />
                   <button onClick={(e) => { e.stopPropagation(); handleVideoUrlSubmit(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">Add</button>
                 </div>
               </div>
             </div>
           )}
        </div>
      )}

      {block.type === 'carousel' && (
        <div className="w-full bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-800 p-8 min-h-[300px] relative overflow-hidden group/carousel-block">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            {(() => {
                let items: string[] = [];
                try { items = JSON.parse(block.content); } catch(e) {
                  console.error("Error parsing carousel items", e);
                }
                
                if (items.length === 0) {
                    return (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl cursor-pointer hover:bg-zinc-800/30 transition-all group/carousel-empty"
                        >
                            <GalleryHorizontal size={40} className="mb-3 opacity-30 group-hover/carousel-empty:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Create Interactive Carousel</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Image Carousel ({items.length})</h5>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"><Plus size={16}/></button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                            {items.map((src, idx) => (
                                <div key={idx} className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 relative group/caritem shadow-lg">
                                    <img src={src} className="w-full h-full object-cover" alt=""/>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const nextItems = items.filter((_, i) => i !== idx);
                                            onChange({...block, content: JSON.stringify(nextItems)});
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover/caritem:opacity-100 transition-opacity"
                                    >
                                        <X size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Interactive Slider */}
                        <CarouselSlider items={items} />
                    </div>
                );
            })()}
        </div>
      )}

      {block.type === 'signature' && (
        <div 
            onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
            className="w-full p-10 bg-zinc-900/30 rounded-[3.5rem] border border-dashed border-zinc-800 flex flex-col items-center gap-6 cursor-pointer hover:bg-zinc-800/30 transition-all group/sig-block"
        >
            <div className="flex items-center gap-3">
                <PenTool size={22} className="text-blue-500" />
                <h5 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.25em]">Authorized Signature</h5>
            </div>
            
            <div className="w-full flex flex-col items-center">
                {block.content ? (
                    <>
                        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-zinc-800/50 mb-6 flex items-center justify-center min-h-[160px] w-full max-w-lg overflow-hidden group-hover/sig-block:scale-[1.02] transition-transform duration-500">
                           {block.properties?.mode === 'TYPE' ? (
                               <span 
                                 className="text-6xl text-black truncate text-center select-none" 
                                 style={{ fontFamily: block.properties?.font || 'Pacifico' }}
                               >
                                 {block.content}
                               </span>
                           ) : (
                               <img src={block.content} className="max-h-32 object-contain" alt="Signature" />
                           )}
                        </div>
                        <div className="space-y-1.5 text-center animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-sm font-black text-white">{block.properties?.name || 'Authorized Signatory'}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{block.properties?.email || 'authenticated-source@agencyos.io'}</p>
                            <div className="pt-2 flex items-center justify-center gap-4 text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em]">
                                <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
                                    <ShieldCheck size={12} /> SECURE LOGGED: {block.properties?.date || '2026/01/10'}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                       <div className="p-5 bg-zinc-800 rounded-full text-zinc-500 group-hover/sig-block:text-blue-500 group-hover/sig-block:scale-110 transition-all">
                          <Plus size={32}/>
                       </div>
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Initialize Signature Block</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {block.type === 'upload' && (
        <div className="w-full">
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
           {localContent ? (
                <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 group/file">
                   <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-blue-500"><FileIcon size={24} /></div>
                   <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">File</p></div>
                   <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors" title="Replace File"><RefreshCw size={18} /></button>
                </div>
           ) : (
             <div onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex flex-col items-center gap-3 text-zinc-500 bg-zinc-900/50 w-full h-40 justify-center rounded-2xl border-2 border-dashed border-zinc-800 cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group/ph">
               <div className="p-3 bg-zinc-800 rounded-full group-hover/ph:scale-110 transition-transform"><FileUp size={24} className="text-zinc-400" /></div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover/ph:text-white">Upload Document</span>
             </div>
           )}
        </div>
      )}

      {block.type === 'banner' && (
        <div 
          className={`w-full p-6 rounded-2xl border flex gap-4 items-start transition-all group/banner relative ${getBannerStyle(block.properties?.variant || 'info')}`}
          style={{
             fontFamily: block.properties?.fontFamily,
             fontSize: block.properties?.fontSize,
             fontWeight: block.properties?.fontWeight,
             ...(block.properties?.color ? { color: block.properties.color } : {})
          }}
        >
           <button 
             onClick={(e) => {
               e.stopPropagation();
               const variants = ['info', 'success', 'warning', 'error', 'neutral', 'purple', 'pink', 'indigo', 'teal', 'orange'];
               const currentIdx = variants.indexOf(block.properties?.variant || 'info');
               const nextVariant = variants[(currentIdx + 1) % variants.length];
               onChange({ ...block, properties: { ...block.properties, variant: nextVariant as any }});
             }}
             className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
             title="Click to cycle style"
           >
             {getBannerIcon(block.properties?.variant || 'info')}
           </button>
           
           <textarea 
              value={localContent} 
              onChange={(e) => { setLocalContent(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px';}} 
              onBlur={handleContentBlur} 
              className="w-full bg-transparent outline-none resize-none overflow-hidden text-sm font-bold placeholder:text-current/50" 
              placeholder="Banner message..." 
              rows={1} 
              style={{ color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit', fontWeight: block.properties?.fontWeight || 'bold' }} 
           />

           {isSelected && (
             <button 
                onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                className="absolute top-2 right-2 p-1.5 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-current transition-colors opacity-0 group-hover/banner:opacity-100"
                title="Banner Settings"
             >
                <Settings2 size={14} />
             </button>
           )}
        </div>
      )}

      {block.type === 'colorbox' && (
        <div 
          className="w-full rounded-[2.5rem] border border-transparent transition-all group/colorbox relative"
          style={{
            backgroundColor: block.properties?.backgroundColor || '#2563eb10',
            padding: `${block.properties?.padding || 40}px`
          }}
        >
           <textarea 
              value={localContent} 
              onChange={(e) => { setLocalContent(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px';}} 
              onBlur={handleContentBlur} 
              className="w-full bg-transparent outline-none resize-none overflow-hidden" 
              placeholder="Container text..." 
              rows={1} 
              style={richStyle} 
           />
           {isSelected && (
             <button 
                onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                className="absolute top-3 right-3 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg shadow-lg hover:bg-zinc-700 transition-colors z-20"
                title="Container Settings"
             >
                <Settings2 size={16} />
             </button>
           )}
        </div>
      )}

      {block.type === 'embed' && (
        <div className="w-full rounded-[2rem] overflow-hidden bg-zinc-900/20 border border-dashed border-zinc-800 min-h-[100px] relative group/embed">
            {localContent ? (
                <div className="relative w-full min-h-[400px]">
                    {localContent.trim().startsWith('<iframe') ? (
                        <div className="w-full h-full flex" dangerouslySetInnerHTML={{ __html: localContent }} />
                    ) : (
                        <iframe src={localContent} className="w-full h-[600px]" frameBorder="0" />
                    )}
                    {isSelected && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover/embed:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button 
                             onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                             className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl"
                           >
                             Update Resource
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); window.open(localContent, '_blank'); }} className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"><ExternalLink size={20}/></button>
                        </div>
                    )}
                </div>
            ) : (
                <div 
                    onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                    className="w-full h-40 flex flex-col items-center justify-center gap-3 text-zinc-500 cursor-pointer hover:bg-zinc-800/30 transition-all"
                >
                    <div className="p-3 bg-zinc-800 rounded-full"><LinkIcon size={24}/></div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Connect External Resource</p>
                </div>
            )}
        </div>
      )}

      {block.type === 'table' && (
        (() => {
          let data = [['', ''], ['', '']];
          try {
             const parsed = JSON.parse(localContent);
             if (Array.isArray(parsed)) data = parsed;
          } catch(e) {
             console.error("Error parsing table content", e);
          }

          const updateCell = (rIndex: number, cIndex: number, val: string) => {
             const newData = [...data];
             newData[rIndex] = [...newData[rIndex]];
             newData[rIndex][cIndex] = val;
             const json = JSON.stringify(newData);
             setLocalContent(json);
             onChange({ ...block, content: json });
          };

          const addRow = () => {
             const cols = data[0].length;
             const newRow = new Array(cols).fill('');
             const newData = [...data, newRow];
             onChange({ ...block, content: JSON.stringify(newData) });
          };

          return (
             <div className="w-full relative group/table">
                <div className="w-full overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full border-collapse">
                    <tbody>
                        {data.map((row, rIndex) => (
                            <tr key={rIndex}>
                                {row.map((cell, cIndex) => (
                                <td key={cIndex} className={`border border-zinc-800 p-0 ${rIndex === 0 ? 'bg-zinc-900 font-bold' : ''}`}>
                                    <input
                                        className="w-full bg-transparent p-3 outline-none text-sm text-zinc-300 focus:bg-blue-500/10 transition-colors"
                                        value={cell}
                                        onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                                    />
                                </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); addRow() }} 
                    className="mt-2 w-full py-2 border-2 border-dashed border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/50 transition-all uppercase tracking-widest"
                >
                    + Add Row
                </button>

                {isSelected && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                     className="absolute -top-3 -right-3 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg shadow-lg hover:bg-zinc-700 transition-colors z-20"
                     title="Table Settings"
                   >
                      <Settings2 size={16} />
                   </button>
                )}
             </div>
          );
        })()
      )}

      {block.type === 'dynamic_table' && (
        <DatabaseTable block={block} isSelected={isSelected} onChange={onChange} />
      )}

      {block.type === 'divider' && (
         <div className="w-full py-6 flex items-center justify-center relative group/div" onClick={(e) => { e.stopPropagation(); onClick(e); }}>
            <div 
                className="w-full transition-all"
                style={{
                    height: block.properties?.width ? `${block.properties.width}px` : '1px',
                    backgroundColor: block.properties?.color || '#27272a',
                    borderTop: block.properties?.style === 'Dashed' ? `1px dashed ${block.properties.color || '#27272a'}` : block.properties?.style === 'Dotted' ? `2px dotted ${block.properties.color || '#27272a'}` : undefined,
                    background: block.properties?.style && block.properties.style !== 'Solid' ? 'transparent' : undefined
                }} 
            />
            {isSelected && (
                <button 
                    onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(e.currentTarget.getBoundingClientRect()); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg shadow-lg hover:bg-zinc-700 transition-colors z-20"
                >
                    <Settings2 size={16} />
                </button>
            )}
         </div>
      )}

      {block.type === 'column' && (
         <ColumnBlock 
            block={block} 
            isSelected={isSelected} 
            onChange={onChange} 
            richStyle={richStyle} 
            onOpenSettings={(rect: DOMRect) => onOpenSettings && onOpenSettings(rect)}
         />
      )}

      {block.type === 'emoji' && (
         <div className="w-full py-4 relative group/emoji">
            <div className="flex items-center gap-4 bg-[#1e1e24]/30 p-4 rounded-3xl border border-transparent hover:border-zinc-800 transition-all group-hover:bg-zinc-900 shadow-sm">
                <div 
                  className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-sm"
                  onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                >
                   {block.content?.match(/(\p{Emoji})/gu)?.[0] || '🚀'}
                </div>
                <input 
                  type="text"
                  placeholder="Notes beside emoji..."
                  className="flex-1 bg-transparent border-none outline-none font-bold text-white placeholder:text-zinc-700"
                  value={block.content?.replace(/(\p{Emoji})/gu, '') || ''}
                  onChange={(e) => {
                      const currentEmoji = block.content?.match(/(\p{Emoji})/gu)?.[0] || '🚀';
                      onChange({ ...block, content: currentEmoji + e.target.value });
                  }}
                />
            </div>
            {showEmojiPicker && (
               <div className="absolute top-full mt-3 z-[500] animate-in zoom-in-95 duration-200 origin-top">
                  <EmojiPicker onSelect={(e) => {
                      const currentText = block.content?.replace(/(\p{Emoji})/gu, '') || '';
                      onChange({ ...block, content: e + currentText });
                  }} onClose={() => setShowEmojiPicker(false)} />
               </div>
            )}
         </div>
      )}

      {block.type === 'newline' && (
         <div 
            className={`w-full transition-all relative ${isSelected ? 'bg-blue-500/5 border-y border-dashed border-blue-500/30' : ''}`}
            style={{ height: `${block.content || '24'}px` }}
         >
            {isSelected && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/40">Vertical Spacer ({block.content}px)</span>
               </div>
            )}
         </div>
      )}
    </div>
  );
};

const TableModal = ({ initialRows = 2, initialCols = 2, onSave, onClose }: { initialRows?: number, initialCols?: number, onSave: (rows: number, cols: number) => void, onClose: () => void }) => {
    const [rows, setRows] = useState(initialRows);
    const [cols, setCols] = useState(initialCols);

    return (
        <div className="w-[320px] bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Table Dimensions</h3>
                <button onClick={onClose}><X size={16} className="text-zinc-500 hover:text-white"/></button>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">No. of Rows</label>
                    <input type="number" min={1} max={50} value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-blue-600" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">No. of Columns</label>
                    <input type="number" min={1} max={20} value={cols} onChange={e => setCols(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-blue-600" />
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-500 text-xs font-bold hover:bg-zinc-800 transition-colors">Cancel</button>
                <button onClick={() => onSave(rows, cols)} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">Apply</button>
            </div>
        </div>
    );
};

const DividerModal = ({ initial, onChange, onDelete, onClose, onOpenColorPicker }: { initial: any, onChange: (props: any) => void, onDelete: () => void, onClose: () => void, onOpenColorPicker: (rect: DOMRect, current: string, setter: (c: string) => void) => void }) => {
    const [color, setColor] = useState(initial.color || '#27272a');
    const [width, setWidth] = useState(parseInt(initial.width || '1'));
    const [style, setStyle] = useState(initial.style || 'Solid');

    const update = (updates: any) => {
        const newProps = { color, width: width.toString(), style, ...updates };
        onChange(newProps);
    };

    return (
        <div className="w-[300px] bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Divider</h3>
                <button onClick={onClose}><X size={16} className="text-zinc-500 hover:text-white"/></button>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-white">Divider Color</label>
                    <Info size={12} className="text-zinc-500" />
                </div>
                <div 
                    className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onOpenColorPicker(rect, color, (c) => {
                            setColor(c);
                            update({ color: c });
                        });
                    }}
                >
                    <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ background: color }} />
                    <span className="text-xs font-bold text-white outline-none w-full">{color}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white">Divider Width</label>
                    <div className="bg-zinc-800 p-2 rounded-lg border border-zinc-700 flex items-center">
                        <input 
                            type="number" 
                            value={width} 
                            onChange={e => {
                                const w = parseInt(e.target.value);
                                setWidth(w);
                                update({ width: w.toString() });
                            }} 
                            className="bg-transparent text-xs font-bold text-zinc-400 outline-none w-full" 
                        />
                        <span className="text-[10px] text-zinc-500 font-bold">px</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white">Divider Style</label>
                    <select 
                        value={style} 
                        onChange={e => {
                            setStyle(e.target.value);
                            update({ style: e.target.value });
                        }} 
                        className="w-full bg-zinc-800 p-2 rounded-lg border border-zinc-700 text-xs font-bold text-white outline-none"
                    >
                        <option>Solid</option>
                        <option>Dashed</option>
                        <option>Dotted</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={onDelete} className="px-4 py-2 rounded-lg border border-rose-900/50 text-rose-500 text-xs font-bold hover:bg-rose-900/20 transition-colors">Delete</button>
                <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-50 transition-colors">Done</button>
            </div>
        </div>
    );
};

const ImageModal = ({ onSave, onClose }: { onSave: (url: string) => void, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'choose' | 'link'>('choose');
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => onSave(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const MOCK_GALLERY = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80",
        "https://images.unsplash.com/photo-1531297461136-82lw9z1a113?w=400&q=80"
    ];

    return (
        <div className="w-[500px] bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">Add Image</h3>
                <button onClick={onClose}><X size={16} className="text-zinc-500 hover:text-white"/></button>
            </div>
            
            <div className="flex border-b border-zinc-800">
                <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'upload' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-white'}`}>Upload Image</button>
                <button onClick={() => setActiveTab('choose')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'choose' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-white'}`}>Choose Image</button>
                <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'link' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-white'}`}>Add Image Link</button>
            </div>

            <div className="p-6 min-h-[250px]">
                {activeTab === 'upload' && (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-8 hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFile} accept="image/*" />
                        <CloudUpload size={32} className="text-zinc-500 mb-4" />
                        <p className="text-xs font-bold text-zinc-400">Click to upload file</p>
                    </div>
                )}
                {activeTab === 'choose' && (
                    <div className="grid grid-cols-2 gap-4">
                        {MOCK_GALLERY.map((src, i) => (
                            <img key={i} src={src} className="w-full h-32 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => onSave(src)} alt="" />
                        ))}
                    </div>
                )}
                {activeTab === 'link' && (
                    <div className="space-y-4">
                        <input type="text" placeholder="Paste image URL..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                        <button onClick={() => onSave(urlInput)} className="w-full py-3 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200">Embed Image</button>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-[#09090b]">
                <button onClick={onClose} className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:text-white transition-colors">Cancel</button>
                <button onClick={() => onSave(urlInput)} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-all">Save</button>
            </div>
        </div>
    );
};

const PageEditor: React.FC = () => {
  console.log("PageEditor: component rendered");
  const { id: pageId } = useParams();
  const navigate = useNavigate();
  
  const [page, setPage] = useState<Page | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<Page[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState('Proposal');
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<{ 
    type: 'text' | 'bg' | 'block-text' | 'block-bg' | 'modal-bg', 
    y: number,
    x?: number, 
    blockId?: string,
    onColorChange?: (color: string) => void,
    currentColor?: string,
    hideSolid?: boolean
  } | null>(null);
  
  const [activePopup, setActivePopup] = useState<{ type: 'text' | 'table' | 'divider' | 'image' | 'section' | 'signature' | 'btn-link' | 'btn-settings' | 'page-settings' | 'embed' | 'colorbox', blockId?: string, x: number, y: number } | null>(null);

  const [pageSize, setPageSize] = useState(800);
  const contentRef = useRef<HTMLDivElement>(null);

  const [pageSettings, setPageSettings] = useState({
    textColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundUrl: '',
    padding: 24,
    lineSpacing: 1.5,
    maxWidth: 1000,
    customize: false,
    fontFamily: 'Inter, sans-serif'
  });

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [isWebShareActive, setIsWebShareActive] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { getPageById, updatePage: savePage } = usePages();

useEffect(() => {
  console.log("PageEditor: useEffect triggered");
  const loadPage = async () => {
    console.log("PageEditor: loadPage called, pageId =", pageId);
    if (!pageId) return;

    const data = await getPageById(pageId);
    console.log("PageEditor: data =", data);

    if (data) {
      setPage(data);
      setHistory([data]);
      setHistoryIndex(0);
      if (data.status === 'Published') setIsWebShareActive(true);
      if (data.settings) {
          setPageSettings(prev => ({ ...prev, ...data.settings }));
      }
    } else {
      const newPage: Page = {
        id: pageId,
        title: 'Untitled Page',
        slug: 'untitled',
        status: 'Draft',
        owner: 'Agency Admin',
        updatedAt: 'Just now',
        views: 0,
        blocks: [],
        settings: pageSettings
      };
      setPage(newPage);
      setHistory([newPage]);
      setHistoryIndex(0);
    }
  };

  loadPage();
}, [pageId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
      if (activeColorPicker && !(event.target as HTMLElement).closest('.color-picker-trigger') && !(event.target as HTMLElement).closest('.advanced-color-picker-portal')) {
         setActiveColorPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColorPicker]);

  // Page expansion logic
  useEffect(() => {
    if (!contentRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        // If content height gets within 150px of current pageSize, double it
        if (height > pageSize - 150) {
          setPageSize(prev => prev * 2);
        }
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [pageSize, page?.blocks.length]);

const updatePage = (updates: Partial<Page>, addToHistory = true) => {
  if (!page) return;

  const updated = { ...page, ...updates };
  setPage(updated);

  if (addToHistory) {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }
};


  // Auto-save effect
  useEffect(() => {
    if (!page) return;
    const timer = setTimeout(() => {
        handleSave();
    }, 1000);
    return () => clearTimeout(timer);
  }, [page, pageSettings]);

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          setPage(history[prevIndex]);
          setHistoryIndex(prevIndex);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setPage(history[nextIndex]);
          setHistoryIndex(nextIndex);
      }
  };

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          }
      }
  };

const handleSave = async () => {
  if (!page) return;
  setSaveStatus('saving');

  try {
    await savePage(page.id, {
      title: page.title,
      slug: page.slug,
      blocks: page.blocks,
      settings: pageSettings
    });
    
    setLastSaved(new Date());
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    console.error("Failed to save page:", error);
    setSaveStatus('idle');
  }
};

  const addBlock = (type: string) => {
    if (!page) return;
    
    if (type === 'table') {
        const center = { x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 100 };
        setActivePopup({ type: 'table', x: center.x, y: center.y });
        return;
    }
    if (type === 'image') {
        const center = { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 };
        setActivePopup({ type: 'image', x: center.x, y: center.y });
        return;
    }
    if (type === 'signature') {
        const center = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 300 };
        setActivePopup({ type: 'signature', x: center.x, y: center.y });
        return;
    }
    if (type === 'embed') {
        const center = { x: window.innerWidth / 2 - 240, y: window.innerHeight / 2 - 150 };
        setActivePopup({ type: 'embed', x: center.x, y: center.y });
        return;
    }

    let defaultContent = '';
    if (type === 'button') defaultContent = 'Button';
    else if (type === 'heading') defaultContent = '';
    else if (type === 'banner') defaultContent = '';
    else if (type === 'table') defaultContent = JSON.stringify([['', ''], ['', '']]);
    else if (type === 'column') defaultContent = JSON.stringify([['', '']]);
    else if (type === 'emoji') defaultContent = '🚀 ';
    else if (type === 'newline') defaultContent = '24';
    else if (type === 'carousel') defaultContent = JSON.stringify([]);
    else if (type === 'colorbox') defaultContent = 'Highlight your main agency message here...';
    
    const newBlock: PageBlock = {
      id: `blk-${Date.now()}`,
      type: type as any,
      content: defaultContent,
      properties: { 
        align: 'left', 
        size: 'md', 
        url: type === 'button' ? '#' : undefined,
        buttonText: type === 'button' ? 'Button' : undefined,
        borderRadius: type === 'button' ? 30 : undefined,
        buttonColor: type === 'button' ? '#2563eb' : undefined,
        textColor: type === 'button' ? '#ffffff' : undefined,
        padding: type === 'colorbox' ? 40 : 0,
        backgroundColor: type === 'colorbox' ? '#2563eb10' : undefined
      }
    };
    updatePage({ blocks: [...page.blocks, newBlock] });
    setSelectedBlockId(newBlock.id);
    setAddMenuOpen(false);
    return newBlock;
  };

  const createTableBlock = (rows: number, cols: number) => {
      const data = Array.from({ length: rows }, () => Array(cols).fill(''));
      const newBlock: PageBlock = {
        id: `blk-${Date.now()}`,
        type: 'table',
        content: JSON.stringify(data),
        properties: { align: 'left' }
      };
      updatePage({ blocks: [...(page?.blocks || []), newBlock] });
      setActivePopup(null);
  };

  const createImageBlock = (url: string) => {
      const newBlock: PageBlock = {
        id: `blk-${Date.now()}`,
        type: 'image',
        content: url,
        properties: { align: 'center' }
      };
      updatePage({ blocks: [...(page?.blocks || []), newBlock] });
      setActivePopup(null);
  };

  const updateBlock = (block: PageBlock) => {
    if (!page) return;
    updatePage({ blocks: page.blocks.map(b => b.id === block.id ? block : b) });
  };

  const deleteBlock = (id: string) => {
    if (!page) return;
    updatePage({ blocks: page.blocks.filter(b => b.id !== id) });
    setSelectedBlockId(null);
    setActivePopup(null);
  };

  const handleBlockClick = (blockId: string, event: React.MouseEvent) => {
    setSelectedBlockId(blockId);
  };

  const handleTextBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popupX = rect.right + 20;
    const popupY = rect.top;

    let targetBlockId = selectedBlockId;
    const currentBlock = page?.blocks.find(b => b.id === selectedBlockId);
    
    if (!currentBlock || (currentBlock.type !== 'text' && currentBlock.type !== 'heading' && currentBlock.type !== 'colorbox')) {
       const newBlock = addBlock('text');
       if (newBlock) targetBlockId = newBlock.id;
    }

    if (targetBlockId) {
        if (activePopup?.blockId === targetBlockId && activePopup.type === 'text') {
            setActivePopup(null);
        } else {
            setActivePopup({ type: 'text', blockId: targetBlockId, x: popupX, y: popupY });
        }
    }
  };

  const handleBlockSettings = (blockId: string, rect: DOMRect) => {
      const block = page?.blocks.find(b => b.id === blockId);
      if (!block) return;

      const windowWidth = window.innerWidth;
      const popupWidth = 350;
      let x = rect.right + 10;
      if (x + popupWidth > windowWidth) x = rect.left - popupWidth - 10;
      if (x < 80) x = 80; // Avoid overlapping sidebar area too much if small screen

      if (block.type === 'divider') {
          setActivePopup({ type: 'divider', blockId, x, y: rect.top + 40 });
      } else if (block.type === 'banner') {
          setActivePopup({ type: 'text', blockId, x, y: rect.top });
      } else if (block.type === 'table') {
          setActivePopup({ type: 'table', blockId, x, y: rect.top });
      } else if (block.type === 'image') {
          setActivePopup({ type: 'image', blockId, x: rect.left, y: rect.top });
      } else if (block.type === 'column') {
          setActivePopup({ type: 'section', blockId, x, y: rect.top });
      } else if (block.type === 'signature') {
          setActivePopup({ type: 'signature', blockId, x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 300 });
      } else if (block.type === 'button') {
          setActivePopup({ type: 'btn-settings', blockId, x: rect.left - 380, y: rect.top });
      } else if (block.type === 'embed') {
          setActivePopup({ type: 'embed', blockId, x: window.innerWidth / 2 - 240, y: window.innerHeight / 2 - 200 });
      } else if (block.type === 'colorbox') {
          setActivePopup({ type: 'colorbox', blockId, x, y: rect.top });
      }
  };

  const handleBlockColorPicker = (blockId: string, rect: DOMRect, type: 'text' | 'bg') => {
    const PICKER_WIDTH = 340;
    const windowWidth = window.innerWidth;
    let x = rect.right + 10;
    if (x + PICKER_WIDTH > windowWidth) x = rect.left - PICKER_WIDTH - 10;
    if (x < 10) x = 10;

    setActiveColorPicker({
        type: type === 'bg' ? 'block-bg' : 'block-text',
        blockId,
        x: x,
        y: rect.top
    });
  };

  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {
      maxWidth: viewport === 'mobile' ? '375px' : `${pageSettings.maxWidth}px`,
      padding: `${pageSettings.padding}px`,
      lineHeight: pageSettings.lineSpacing,
      minHeight: `${pageSize}px`
    };

    if (pageSettings.backgroundUrl) {
      const isGradient = pageSettings.backgroundColor.startsWith('linear-gradient') || pageSettings.backgroundColor.startsWith('radial-gradient');
      if (isGradient) {
        style.backgroundImage = `url(${pageSettings.backgroundUrl}), ${pageSettings.backgroundColor}`;
        style.backgroundSize = 'cover, auto';
        style.backgroundPosition = 'center, center';
        style.backgroundRepeat = 'no-repeat, no-repeat';
      } else {
        style.backgroundImage = `url(${pageSettings.backgroundUrl})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundColor = pageSettings.backgroundColor;
      }
    } else {
        if (pageSettings.backgroundColor.startsWith('linear-gradient') || pageSettings.backgroundColor.startsWith('radial-gradient')) {
            style.backgroundImage = pageSettings.backgroundColor;
        } else {
            style.backgroundColor = pageSettings.backgroundColor;
        }
    }
    return style;
  };

  const ADD_ELEMENTS = [
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'video', label: 'Video', icon: Video },
    { type: 'upload', label: 'Doc Upload', icon: FileUp },
    { type: 'embed', label: 'Embed', icon: LinkIcon },
    { type: 'banner', label: 'Top Banner', icon: PanelTop },
    { type: 'colorbox', label: 'Colorbox', icon: Box },
    { type: 'table', label: 'Table', icon: Table },
    { type: 'dynamic_table', label: 'Dynamic Table', icon: Database },
    { type: 'divider', label: 'Divider', icon: Minus },
    { type: 'column', label: 'Column', icon: Columns },
    { type: 'emoji', label: 'Emoji', icon: Smile },
    { type: 'newline', label: 'New Line', icon: WrapText },
    { type: 'signature', label: 'Signature', icon: PenTool },
    { type: 'button', label: 'Button', icon: MousePointerClick },
    { type: 'carousel', label: 'Carousel', icon: GalleryHorizontal },
  ];

  if (!page) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading Editor...</div>;

  return (
    <div className="flex h-full bg-[#09090b] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-[#09090b] border-r border-zinc-800 z-50 flex flex-col items-center py-6 gap-6">
         <button 
            className={`p-3 rounded-xl transition-all ${activePopup?.type === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Text"
            onClick={handleTextBtnClick}
         >
            <Type size={20} strokeWidth={2} />
         </button>
         
         <div className="relative">
            <button 
               onClick={() => { setAddMenuOpen(!addMenuOpen); setActivePopup(null); }} 
               className={`p-3 rounded-xl transition-all ${addMenuOpen ? 'bg-blue-600 text-white' : 'text-blue-500 hover:text-blue-400 hover:bg-zinc-800'}`} 
               title="Add Element"
            >
               <Plus size={20} strokeWidth={2.5} />
            </button>
            
            {addMenuOpen && (
               <div ref={addMenuRef} className="absolute left-full top-[-100px] ml-8 bg-[#1e1e24] border border-zinc-700/50 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-left-2 z-[60] w-[400px]">
                  <div className="flex items-center justify-between mb-4 px-1">
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest">Add Elements</h3>
                     <button onClick={() => setAddMenuOpen(false)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700/50">
                        <X size={16} />
                     </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {ADD_ELEMENTS.map((item) => (
                        <button 
                           key={item.type}
                           onClick={(e) => { e.stopPropagation(); addBlock(item.type); }}
                           className="flex items-start gap-3 p-3 hover:bg-zinc-700/30 rounded-xl transition-colors group/item text-left"
                        >
                           <item.icon size={20} className="text-zinc-400 group-hover/item:text-white shrink-0" />
                           <span className="text-[11px] font-bold text-zinc-400 group-hover/item:text-zinc-200">{item.label}</span>
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="h-px w-8 bg-zinc-800 my-1" />
         
         <button 
           onClick={() => { setActivePopup({ type: 'page-settings', x: 0, y: 0 }); setAddMenuOpen(false); }} 
           className={`p-3 rounded-xl transition-all ${activePopup?.type === 'page-settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
           title="Page Settings"
         >
            <Settings size={20} strokeWidth={2} />
         </button>

         <div className="mt-auto flex flex-col gap-4">
            <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-3 rounded-xl transition-all ${historyIndex > 0 ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`} title="Undo"><Undo2 size={20} strokeWidth={2} /></button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-3 rounded-xl transition-all ${historyIndex < history.length - 1 ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`} title="Redo"><Redo2 size={20} strokeWidth={2} /></button>
         </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 relative pl-16">
        <div className="h-20 px-6 flex items-center justify-between shrink-0 bg-[#09090b] z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pages')} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
            <div className="h-6 w-px bg-zinc-800" />
            <input value={page.title} onChange={(e) => updatePage({ title: e.target.value })} className="bg-transparent outline-none font-bold text-sm w-64 text-white placeholder:text-zinc-600" placeholder="Untitled Page" />
          </div>
          <div className="flex items-center gap-4">
             {lastSaved && (
                <div className="hidden md:flex flex-col items-end">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Saved</span>
                   <span className="text-[11px] font-bold text-zinc-400">{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
             )}
             <div className="flex items-center bg-zinc-900 rounded-lg p-1 mr-2 border border-zinc-800">
                <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded transition-all ${viewport === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Smartphone size={16} /></button>
                <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded transition-all ${viewport === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Monitor size={16} /></button>
                <button onClick={toggleFullScreen} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded ml-1" title="Full Screen"><Maximize2 size={16} /></button>
             </div>
             <button 
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 min-w-[100px] justify-center ${
                  saveStatus === 'saved' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                } ${saveStatus === 'saving' ? 'opacity-80 cursor-not-allowed' : ''}`}
             >
                {saveStatus === 'saving' ? (
                   <>
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs font-bold">Saving...</span>
                   </>
                ) : saveStatus === 'saved' ? (
                   <>
                      <Check size={14} className="animate-in zoom-in duration-300" />
                      <span className="text-xs font-bold">Saved</span>
                   </>
                ) : (
                   <span className="text-xs font-bold">Save</span>
                )}
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative flex justify-center p-8 md:p-16 transition-colors duration-300" onClick={() => { setSelectedBlockId(null); setActivePopup(null); }} style={{ backgroundColor: '#000000' }}>
           <div className="w-full border border-zinc-800 rounded-[2.5rem] shadow-2xl p-12 relative animate-in fade-in zoom-in-95 duration-300 transition-all ease-out bg-white dark:bg-black" style={getBackgroundStyle()}>
              {page.blocks.length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 pointer-events-none">
                    <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-zinc-800 mb-6 shadow-inner"><Plus size={64} className="opacity-40" /></div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] opacity-60">Design Canvas Initialized</p>
                 </div>
              )}
              <div ref={contentRef} className="space-y-6">
                 {page.blocks.map(block => (
                    <BlockRenderer 
                      key={block.id} 
                      block={block} 
                      isSelected={selectedBlockId === block.id}
                      onClick={(e) => handleBlockClick(block.id, e)}
                      onChange={updateBlock}
                      onDelete={() => deleteBlock(block.id)}
                      settings={pageSettings}
                      onOpenColorPicker={(rect) => handleBlockColorPicker(block.id, rect, 'bg')}
                      onOpenSettings={(rect) => handleBlockSettings(block.id, rect)}
                      onOpenLink={(rect) => setActivePopup({ type: 'btn-link', blockId: block.id, x: rect.left, y: rect.bottom + 10 })}
                    />
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Template Modal */}
      {isTemplateOpen && createPortal(
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsTemplateOpen(false)} />
          <div className="relative w-full max-w-6xl h-[85vh] bg-[#18181b] rounded-[2rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 shrink-0">
               <h2 className="text-2xl font-bold text-white tracking-tight">Templates</h2>
               <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg">
                    <Plus size={16} /> Create Template
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Search size={20} /></button>
                  <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Maximize2 size={20} /></button>
                  <button onClick={() => setIsTemplateOpen(false)} className="p-2 text-zinc-400 hover:text-white transition-colors"><X size={24} /></button>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 px-8 border-b border-zinc-800 shrink-0 overflow-x-auto no-scrollbar">
                {['Proposal', 'Contract', 'Brief', 'Banners', 'Buttons'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTemplateTab(tab)}
                        className={`py-4 text-sm font-bold transition-all relative ${
                            activeTemplateTab === tab 
                            ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:shadow-[0_-2px_10px_rgba(37,99,235,0.5)]' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
                <button className="py-4 text-zinc-500 hover:text-zinc-300 ml-auto"><ChevronRight size={18} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#0c0c0e]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {MOCK_TEMPLATES.filter(t => t.category === activeTemplateTab).map(template => (
                        <div key={template.id} className="group cursor-pointer flex flex-col gap-3">
                            <div className="aspect-[3/4] bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800 relative group-hover:border-zinc-600 group-hover:shadow-xl transition-all">
                                <img src={template.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={template.name} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">Use Template</span>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{template.name}</h4>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Modals Portals --- */}

      {activeColorPicker && createPortal(
        <div className="fixed z-[10020] advanced-color-picker-portal" style={{ top: Math.min(window.innerHeight - 450, activeColorPicker.y - 20), left: activeColorPicker.x ? activeColorPicker.x : undefined, right: activeColorPicker.x ? undefined : '340px' }}>
          <div className="relative animate-in slide-in-from-right-4 duration-200">
             <AdvancedColorPicker 
               color={
                 activeColorPicker.onColorChange 
                   ? (activeColorPicker.currentColor || 'SOLID')
                   : (activeColorPicker.type === 'text' ? pageSettings.textColor : activeColorPicker.type === 'bg' ? pageSettings.backgroundColor : activeColorPicker.blockId ? (activeColorPicker.type === 'block-bg' ? page?.blocks.find(b => b.id === activeColorPicker.blockId)?.properties?.backgroundColor || '#18181b' : page?.blocks.find(b => b.id === activeColorPicker.blockId)?.properties?.color || '#ffffff') : '#ffffff')
               }
               hideSolid={activeColorPicker.hideSolid}
               onChange={(c) => { 
                 if (activeColorPicker.onColorChange) {
                    activeColorPicker.onColorChange(c);
                 } else if (activeColorPicker.type === 'text') {
                    setPageSettings({...pageSettings, textColor: c});
                 } else if (activeColorPicker.type === 'bg') {
                    setPageSettings({...pageSettings, backgroundColor: c});
                 } else if (activeColorPicker.blockId) { 
                    const blk = page?.blocks.find(b => b.id === activeColorPicker.blockId); 
                    if (blk) { 
                       if (activeColorPicker.type === 'block-bg') { 
                          updateBlock({...blk, properties: {...blk.properties, backgroundColor: c}}); 
                       } else { 
                          updateBlock({...blk, properties: {...blk.properties, color: c}}); 
                       } 
                    } 
                 } 
               }} 
               onClose={() => setActiveColorPicker(null)} 
             />
          </div>
        </div>, document.body
      )}

      {activePopup?.type === 'page-settings' && createPortal(
        <div className="fixed inset-0 z-[10005] flex justify-end">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)} />
            <div className="relative w-[420px] h-full shadow-2xl animate-in slide-in-from-right duration-500">
                <PageSettingsModal 
                    settings={pageSettings}
                    onClose={() => setActivePopup(null)}
                    onOpenColorPicker={(rect, current, setter) => {
                        setActiveColorPicker({ 
                            type: 'modal-bg', 
                            y: rect.top, 
                            x: rect.left - 340, 
                            currentColor: current, 
                            onColorChange: (c) => {
                                setter(c);
                                setActiveColorPicker(prev => prev ? ({ ...prev, currentColor: c }) : null);
                            },
                            hideSolid: true
                        } as any);
                    }}
                    onChange={setPageSettings}
                />
            </div>
        </div>, document.body
      )}

      {activePopup?.type === 'text' && page?.blocks.find(b => b.id === activePopup.blockId) && createPortal(
        <div className="fixed z-[9999] text-settings-popup" style={{ top: activePopup.y, left: activePopup.x }}>
           <TextSettingsPopup block={page.blocks.find(b => b.id === activePopup.blockId)!} onChange={(updates) => updateBlock({ ...page.blocks.find(b => b.id === activePopup.blockId)!, ...updates })} onClose={() => setActivePopup(null)} position={{ x: 0, y: 0 }} onOpenColorPicker={(rect) => setActiveColorPicker({ type: 'block-text', y: rect.top, x: activePopup.x + 330, blockId: activePopup.blockId })} />
        </div>, document.body
      )}

      {activePopup?.type === 'btn-link' && (() => {
        const block = page?.blocks.find(b => b.id === activePopup.blockId);
        if (!block) return null;
        return createPortal(
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
              <ButtonLinkModal 
                  initial={block.properties || {}}
                  onClose={() => setActivePopup(null)}
                  onSave={(data) => {
                      updateBlock({ ...block, properties: { ...block.properties, ...data } });
                      setActivePopup(null);
                  }}
              />
          </div>, document.body
        );
      })()}

      {activePopup?.type === 'btn-settings' && (() => {
        const block = page?.blocks.find(b => b.id === activePopup.blockId);
        if (!block) return null;
        return createPortal(
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
              <ButtonSettingsModal 
                  initial={block.properties || {}}
                  onClose={() => setActivePopup(null)}
                  onDelete={() => { deleteBlock(activePopup.blockId!); setActivePopup(null); }}
                  onOpenColorPicker={(rect: DOMRect, current: string, setter: (c: string) => void) => {
                    setActiveColorPicker({
                        type: 'modal-bg',
                        y: rect.top,
                        x: rect.right + 20,
                        currentColor: current,
                        onColorChange: setter
                    } as any);
                  }}
                  onChange={(data) => {
                      updateBlock({ ...block, properties: { ...block.properties, ...data } });
                  }}
                  onSave={(data) => {
                      updateBlock({ ...block, properties: { ...block.properties, ...data } });
                      setActivePopup(null);
                  }}
              />
          </div>, document.body
        );
      })()}

      {activePopup?.type === 'table' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
            <div className="popup-container relative" style={activePopup.blockId ? { position: 'absolute', top: activePopup.y, left: activePopup.x } : {}}>
               <TableModal 
                 initialRows={activePopup.blockId ? (() => {
                    const b = page?.blocks.find(blk => blk.id === activePopup.blockId);
                    try { return JSON.parse(b?.content || '[]').length || 2; } catch(e) { return 2; }
                 })() : 2}
                 initialCols={activePopup.blockId ? (() => {
                    const b = page?.blocks.find(blk => blk.id === activePopup.blockId);
                    try { return JSON.parse(b?.content || '[]')[0]?.length || 2; } catch(e) { return 2; }
                 })() : 2}
                 onSave={(rows, cols) => { 
                    if (activePopup.blockId) {
                        const b = page?.blocks.find(blk => blk.id === activePopup.blockId);
                        if (b) {
                            let data: string[][] = [];
                            try { data = JSON.parse(b.content || '[]'); } catch(e) {
                              console.error("Error parsing table data", e);
                            }
                            
                            // Adjust rows
                            const newData = [...data];
                            while (newData.length < rows) {
                                newData.push(new Array(cols).fill(''));
                            }
                            while (newData.length > rows) {
                                newData.pop();
                            }
                            
                            // Adjust columns
                            for (let i = 0; i < newData.length; i++) {
                                const row = [...newData[i]];
                                while (row.length < cols) {
                                    row.push('');
                                }
                                while (row.length > cols) {
                                    row.pop();
                                }
                                newData[i] = row;
                            }
                            
                            updateBlock({ ...b, content: JSON.stringify(newData) });
                        }
                    } else { 
                        createTableBlock(rows, cols); 
                    } 
                    setActivePopup(null);
                 }}
                 onClose={() => setActivePopup(null)} 
               />
            </div>
        </div>, document.body
      )}

      {activePopup?.type === 'divider' && (() => {
        const block = page?.blocks.find(b => b.id === activePopup.blockId);
        if (!block) return null;
        return createPortal(
          <div className="fixed z-[9999]" style={{ top: activePopup.y, left: activePopup.x }}>
              <DividerModal 
                  initial={block.properties || {}}
                  onChange={(props) => { updateBlock({ ...block, properties: { ...block.properties, ...props } }); }}
                  onSave={(props) => { updateBlock({ ...block, properties: { ...block.properties, ...props } }); setActivePopup(null); }}
                  onDelete={() => { deleteBlock(activePopup.blockId!); setActivePopup(null); }}
                  onClose={() => setActivePopup(null)}
                  onOpenColorPicker={(rect: DOMRect, current: string, setter: (c: string) => void) => {
                    setActiveColorPicker({
                        type: 'modal-bg',
                        y: rect.top,
                        x: rect.right + 20,
                        currentColor: current,
                        onColorChange: setter
                    } as any);
                  }}
              />
          </div>, document.body
        );
      })()}

      {activePopup?.type === 'image' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
            <div className="popup-container" onClick={e => e.stopPropagation()}>
               <ImageModal 
                 onSave={(url) => { 
                  if(activePopup.blockId) { 
                    const block = page?.blocks.find(b => b.id === activePopup.blockId);
                    if (block) {
                      updateBlock({ ...block, content: url }); 
                    }
                  } else { 
                    createImageBlock(url); 
                  } 
                  setActivePopup(null); 
                }}
                 onClose={() => setActivePopup(null)}
               />
            </div>
        </div>, document.body
      )}

      {activePopup?.type === 'section' && page?.blocks.find(b => b.id === activePopup.blockId) && createPortal(
        <div className="fixed z-[10005] animate-in zoom-in-95 duration-200" style={{ top: Math.min(window.innerHeight - 500, activePopup.y), left: Math.min(window.innerWidth - 340, activePopup.x) }}>
            <SectionSettingsModal 
                initial={page.blocks.find(b => b.id === activePopup.blockId)?.properties || {}}
                onSave={(props: any) => { updateBlock({ ...page.blocks.find(b => b.id === activePopup.blockId)!, properties: { ...page.blocks.find(b => b.id === activePopup.blockId)!.properties, ...props } }); setActivePopup(null); }}
                onDelete={() => { deleteBlock(activePopup.blockId!); setActivePopup(null); }}
                onClose={() => setActivePopup(null)}
                onOpenColorPicker={(rect: DOMRect, currentColor: string, setter: (c: string) => void) => {
                  setActiveColorPicker({
                      type: 'modal-bg',
                      y: rect.top,
                      x: rect.right + 20,
                      currentColor,
                      onColorChange: setter
                  } as any);
                }}
            />
        </div>, document.body
      )}

      {activePopup?.type === 'signature' && (() => {
        const block = activePopup.blockId ? page?.blocks.find(b => b.id === activePopup.blockId) : null;
        return createPortal(
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
              <SignatureModal 
                  initialValue={block ? block.content || '' : ''}
                  initialMeta={block ? block.properties || {} : {}}
                  onClose={() => setActivePopup(null)}
                  onDelete={() => {
                     if (activePopup.blockId) {
                        deleteBlock(activePopup.blockId);
                     }
                     setActivePopup(null);
                  }}
                  onOpenColorPicker={(rect: DOMRect, current: string, setter: (c: string) => void) => {
                    setActiveColorPicker({
                        type: 'modal-bg',
                        y: rect.top,
                        x: rect.right + 20,
                        currentColor: current,
                        onColorChange: setter
                    } as any);
                  }}
                  onChange={activePopup.blockId && block ? (val, meta) => {
                      updateBlock({ ...block, content: val, properties: { ...block.properties, ...meta } });
                  } : undefined}
                  onSave={(val, meta) => {
                      if (activePopup.blockId && block) {
                          updateBlock({ ...block, content: val, properties: { ...block.properties, ...meta } });
                      } else {
                          const newBlock: PageBlock = {
                              id: `blk-${Date.now()}`,
                              type: 'signature',
                              content: val,
                              properties: { ...meta }
                          };
                          updatePage({ blocks: [...(page?.blocks || []), newBlock] });
                          setSelectedBlockId(newBlock.id);
                      }
                      setActivePopup(null);
                  }}
              />
          </div>, document.body
        );
      })()}

      {activePopup?.type === 'embed' && createPortal(
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActivePopup(null)}>
            <EmbedModal 
                initialContent={activePopup.blockId ? page?.blocks.find(b => b.id === activePopup.blockId)?.content || '' : ''}
                onClose={() => setActivePopup(null)}
                onSave={(val) => {
                    if (activePopup.blockId) {
                        const block = page?.blocks.find(b => b.id === activePopup.blockId);
                        if (block) {
                          updateBlock({ ...block, content: val });
                        }
                    } else {
                        const newBlock: PageBlock = {
                            id: `blk-${Date.now()}`,
                            type: 'embed',
                            content: val,
                            properties: { }
                        };
                        updatePage({ blocks: [...(page?.blocks || []), newBlock] });
                        setSelectedBlockId(newBlock.id);
                    }
                    setActivePopup(null);
                }}
            />
        </div>, document.body
      )}

      {activePopup?.type === 'colorbox' && page?.blocks.find(b => b.id === activePopup.blockId) && createPortal(
        <div className="fixed z-[10005] animate-in zoom-in-95 duration-200" style={{ top: Math.min(window.innerHeight - 500, activePopup.y), left: Math.min(window.innerWidth - 340, activePopup.x) }}>
            <ColorboxSettingsModal 
                initial={page.blocks.find(b => b.id === activePopup.blockId)?.properties || {}}
                onSave={(props: any) => { updateBlock({ ...page.blocks.find(b => b.id === activePopup.blockId)!, properties: { ...page.blocks.find(b => b.id === activePopup.blockId)!.properties, ...props } }); setActivePopup(null); }}
                onDelete={() => { deleteBlock(activePopup.blockId!); setActivePopup(null); }}
                onClose={() => setActivePopup(null)}
                onOpenColorPicker={(rect: DOMRect, currentColor: string, setter: (c: string) => void) => {
                  setActiveColorPicker({
                      type: 'modal-bg',
                      y: rect.top,
                      x: rect.right + 20,
                      currentColor,
                      onColorChange: setter
                  } as any);
                }}
            />
        </div>, document.body
      )}

    </div>
  );
};

export default PageEditor;