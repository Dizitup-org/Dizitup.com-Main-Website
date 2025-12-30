
import React from 'react';
import { Video, Layout, Rocket, Zap, BrainCircuit, BarChart3 } from 'lucide-react';
import { SaleRecord } from './types';

export const COLORS = {
  primary: '#000000',
  accent: '#b91c1c', // Crimson Red
  muted: '#737373',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const SERVICES = [
  {
    title: "AI-Enhanced Video Editing",
    description: "Faster turnaround, AI-driven hooks, and automated captions with pixel-perfect human finishing.",
    icon: <Video className="w-6 h-6" />,
  },
  {
    title: "AI-Powered Graphic Design",
    description: "Brand consistency at scale. We use generative AI for iterations and human creative for direction.",
    icon: <Layout className="w-6 h-6" />,
  },
  {
    title: "High-Conversion Web & UI",
    description: "AI-optimized copy and user experiences that guide visitors effortlessly towards booking.",
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    title: "AI Workflow Automation",
    description: "Seamlessly connect leads, CRM, WhatsApp, and email into a single intelligent growth machine.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "AI Strategy Consulting",
    description: "We don't just build; we decide. We analyze your bottleneck and deploy the right AI logic to fix it.",
    icon: <BrainCircuit className="w-6 h-6" />,
  }
];

export const SALES_DATA: SaleRecord[] = [
  { id: '1', date: '2024-05-12', clientName: 'Nexus Tech', service: 'Growth Retainer', amount: 150000, status: 'Paid', type: 'Retainer' },
  { id: '2', date: '2024-05-14', clientName: 'Solaris Web', service: 'Starter Setup', amount: 85000, status: 'Paid', type: 'One-time' },
  { id: '3', date: '2024-05-15', clientName: 'Luna Beauty', service: 'Growth Retainer', amount: 150000, status: 'Pending', type: 'Retainer' },
  { id: '4', date: '2024-05-18', clientName: 'FitTrack', service: 'Video Automation', amount: 60000, status: 'Paid', type: 'One-time' },
  { id: '5', date: '2024-05-20', clientName: 'GreenLabs', service: 'Growth Retainer', amount: 150000, status: 'Paid', type: 'Retainer' },
  { id: '6', date: '2024-05-22', clientName: 'Stellar Labs', service: 'Consulting', amount: 120000, status: 'Pending', type: 'One-time' },
];

export const REVENUE_CHART_DATA = [
  { name: 'Week 1', revenue: 450000 },
  { name: 'Week 2', revenue: 520000 },
  { name: 'Week 3', revenue: 480000 },
  { name: 'Week 4', revenue: 715000 },
];
