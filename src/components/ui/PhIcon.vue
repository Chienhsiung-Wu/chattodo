<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  Bell, BellOff, Check, CheckCircle2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  X, Plus, PlusCircle, Search, Moon, Sun, Lock, Briefcase, Users, User, UserPlus,
  Folder, Folders, Lightbulb, Inbox, Sparkles, Settings, Table, MessageCircle, Send,
  AtSign, Clock, Calendar, CalendarPlus, Flag, Quote, ShieldCheck, LogOut, Download,
  Trash2, Zap, Eye, BarChart3, Keyboard, ListChecks, Compass, Brain, SlidersHorizontal,
  Fingerprint, Target, MessagesSquare, Plug, Database, RefreshCw, Loader2, AlertCircle,
  PartyPopper, ArrowRight, ArrowUpRight, ArrowUpDown, RotateCw, Undo2, CornerDownRight,
  CornerUpLeft, GripVertical, TrendingUp, Rows3, Columns3, Layers, CircleDashed,
  StickyNote, MessageSquareText, CircleUser, UserCog, Play, KeyRound, Sunrise, LayoutGrid,
} from 'lucide-vue-next';

/**
 * Data-driven icon: maps legacy phosphor icon names (still stored in state /
 * server payloads, e.g. notifications' `icon: 'ph-bell'`) onto lucide
 * components — keeps the server contract untouched while the UI goes lucide.
 */
const MAP: Record<string, Component> = {
  'ph-bell': Bell, 'ph-bell-slash': BellOff,
  'ph-check': Check, 'ph-check-circle': CheckCircle2, 'ph-check-square': ListChecks,
  'ph-caret-down': ChevronDown, 'ph-caret-up': ChevronUp, 'ph-caret-left': ChevronLeft, 'ph-caret-right': ChevronRight,
  'ph-x': X, 'ph-plus': Plus, 'ph-plus-circle': PlusCircle,
  'ph-magnifying-glass': Search, 'ph-moon': Moon, 'ph-sun': Sun,
  'ph-lock-simple': Lock, 'ph-lock-key': KeyRound, 'ph-briefcase': Briefcase,
  'ph-users': Users, 'ph-users-three': Users, 'ph-user': User, 'ph-user-plus': UserPlus,
  'ph-user-circle': CircleUser, 'ph-user-gear': UserCog,
  'ph-folder': Folder, 'ph-folders': Folders, 'ph-lightbulb': Lightbulb,
  'ph-tray': Inbox, 'ph-sparkle': Sparkles, 'ph-gear': Settings, 'ph-table': Table,
  'ph-chat-circle': MessageCircle, 'ph-chat-teardrop-text': MessageSquareText, 'ph-chats-circle': MessagesSquare,
  'ph-paper-plane-tilt': Send, 'ph-at': AtSign, 'ph-clock': Clock,
  'ph-calendar-blank': Calendar, 'ph-calendar-plus': CalendarPlus, 'ph-flag': Flag,
  'ph-quotes': Quote, 'ph-shield-check': ShieldCheck, 'ph-sign-out': LogOut,
  'ph-download-simple': Download, 'ph-trash': Trash2, 'ph-lightning': Zap,
  'ph-eye': Eye, 'ph-chart-bar': BarChart3, 'ph-chart-line-up': TrendingUp,
  'ph-keyboard': Keyboard, 'ph-list-checks': ListChecks, 'ph-compass': Compass,
  'ph-brain': Brain, 'ph-sliders-horizontal': SlidersHorizontal, 'ph-fingerprint': Fingerprint,
  'ph-strategy': Target, 'ph-plugs-connected': Plug, 'ph-database': Database,
  'ph-arrows-clockwise': RefreshCw, 'ph-circle-notch': Loader2, 'ph-warning-circle': AlertCircle,
  'ph-confetti': PartyPopper, 'ph-arrow-right': ArrowRight, 'ph-arrow-up-right': ArrowUpRight,
  'ph-arrows-down-up': ArrowUpDown, 'ph-arrow-clockwise': RotateCw, 'ph-arrow-counter-clockwise': Undo2,
  'ph-arrow-bend-down-right': CornerDownRight, 'ph-arrow-elbow-down-right': CornerDownRight,
  'ph-arrow-u-up-left': CornerUpLeft, 'ph-dots-six-vertical': GripVertical,
  'ph-rows': Rows3, 'ph-kanban': Columns3, 'ph-stack': Layers, 'ph-circle-dashed': CircleDashed,
  'ph-note': StickyNote, 'ph-note-blank': StickyNote, 'ph-play': Play,
  'ph-sun-horizon': Sunrise, 'ph-squares-four': LayoutGrid,
};

const props = defineProps<{ name?: string; size?: number; class?: string }>();
const icon = computed(() => MAP[props.name || ''] || Bell);
</script>

<template>
  <component :is="icon" :size="size || 16" :class="props.class" />
</template>
