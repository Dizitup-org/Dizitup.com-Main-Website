// Sales event broadcasting utility
// This helps coordinate updates across different dashboard components

export const SALES_EVENTS = {
  SALES_UPDATED: 'salesUpdated',
  REVENUE_CHANGED: 'revenueChanged',
  STATS_REFRESH_NEEDED: 'statsRefreshNeeded'
} as const;

export interface SalesEventDetail {
  type: 'add' | 'update' | 'delete';
  saleId?: string;
  sale?: any;
  timestamp?: number;
}

// Helper function to broadcast sales updates
export const broadcastSalesUpdate = (detail: SalesEventDetail) => {
  const event = new CustomEvent(SALES_EVENTS.SALES_UPDATED, { 
    detail: { 
      ...detail, 
      timestamp: Date.now() 
    } 
  });
  
  window.dispatchEvent(event);
  
  // Also broadcast general stats refresh event
  window.dispatchEvent(new CustomEvent(SALES_EVENTS.STATS_REFRESH_NEEDED, {
    detail: { source: 'sales', ...detail }
  }));
  
  console.log('📊 Sales update broadcasted:', detail);
};

// Helper to listen for sales updates
export const listenToSalesUpdates = (callback: (detail: SalesEventDetail) => void) => {
  const handler = (event: CustomEvent<SalesEventDetail>) => {
    callback(event.detail);
  };
  
  window.addEventListener(SALES_EVENTS.SALES_UPDATED, handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(SALES_EVENTS.SALES_UPDATED, handler as EventListener);
  };
};

// Helper to listen for general stats refresh requests
export const listenToStatsRefresh = (callback: () => void) => {
  window.addEventListener(SALES_EVENTS.STATS_REFRESH_NEEDED, callback);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(SALES_EVENTS.STATS_REFRESH_NEEDED, callback);
  };
};