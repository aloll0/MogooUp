import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardOrderState {
  widgetOrder: string[];
  updateOrder: (newOrder: string[]) => void;
}

export const useDashboardOrderStore = create<DashboardOrderState>()(
  persist(
    (set) => ({
      widgetOrder: ['completed-tasks', 'overdue-tasks', 'member-dist', 'priority-dist', 'time-tracking-summary'],
      updateOrder: (newOrder) => set({ widgetOrder: newOrder }),
    }),
    {
      name: 'mogoo_dashboard_widget_order',
    }
  )
);
