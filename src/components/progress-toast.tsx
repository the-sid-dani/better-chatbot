"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "lib/utils";

// Progress toast for dashboard generation with real-time feedback
interface ProgressToastProps {
  isVisible: boolean;
  message: string;
  progress: number;
  status: 'initializing' | 'building_chart' | 'completed' | 'error';
  className?: string;
}

export function ProgressToast({
  isVisible,
  message,
  progress,
  status,
  className
}: ProgressToastProps) {
  // Determine icon and styling based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          bgColor: "bg-green-50 dark:bg-green-950",
          borderColor: "border-green-200 dark:border-green-800",
          progressColor: "bg-green-500"
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          bgColor: "bg-red-50 dark:bg-red-950",
          borderColor: "border-red-200 dark:border-red-800",
          progressColor: "bg-red-500"
        };
      default:
        return {
          icon: <BarChart3 className="w-5 h-5 text-primary animate-spin" />,
          bgColor: "bg-card",
          borderColor: "border-border",
          progressColor: "bg-primary"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.4
          }}
          className={cn(
            "fixed bottom-4 right-4 z-50 shadow-lg rounded-lg p-4 min-w-[320px] max-w-[400px]",
            statusConfig.bgColor,
            statusConfig.borderColor,
            "border backdrop-blur-sm",
            className
          )}
        >
          <div className="flex items-center space-x-3">
            {/* Status icon with animation */}
            <div className="flex-shrink-0">
              {statusConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {message}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <motion.div
                  className={cn("h-2 rounded-full", statusConfig.progressColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    duration: 0.6
                  }}
                />
              </div>

              {/* Progress percentage */}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {status === 'completed' ? 'Complete' :
                   status === 'error' ? 'Error' :
                   'Building dashboard...'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Subtle glow effect for active states */}
          {(status === 'initializing' || status === 'building_chart') && (
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast state interface
interface ToastState {
  isVisible: boolean;
  message: string;
  progress: number;
  status: 'initializing' | 'building_chart' | 'completed' | 'error';
}

// Hook for managing progress toast state
export function useProgressToast() {
  const [toastState, setToastState] = useState<ToastState>({
    isVisible: false,
    message: '',
    progress: 0,
    status: 'initializing'
  });

  const showProgress = useCallback((
    message: string,
    progress: number = 0,
    status: 'initializing' | 'building_chart' | 'completed' | 'error' = 'initializing'
  ) => {
    setToastState({
      isVisible: true,
      message,
      progress,
      status
    });
  }, []);

  const updateProgress = useCallback((
    progress: number,
    message?: string,
    status?: 'initializing' | 'building_chart' | 'completed' | 'error'
  ) => {
    setToastState(prev => ({
      ...prev,
      progress,
      ...(message && { message }),
      ...(status && { status })
    }));
  }, []);

  const hideProgress = useCallback((delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        setToastState(prev => ({ ...prev, isVisible: false }));
      }, delay);
    } else {
      setToastState(prev => ({ ...prev, isVisible: false }));
    }
  }, []);

  const completeProgress = useCallback((message: string = 'Dashboard complete!', hideDelay: number = 2000) => {
    setToastState(prev => ({
      ...prev,
      message,
      progress: 100,
      status: 'completed'
    }));

    if (hideDelay > 0) {
      setTimeout(() => {
        setToastState(prev => ({ ...prev, isVisible: false }));
      }, hideDelay);
    }
  }, []);

  const errorProgress = useCallback((message: string = 'Error occurred', hideDelay: number = 3000) => {
    setToastState(prev => ({
      ...prev,
      message,
      status: 'error'
    }));

    if (hideDelay > 0) {
      setTimeout(() => {
        setToastState(prev => ({ ...prev, isVisible: false }));
      }, hideDelay);
    }
  }, []);

  return {
    toastState,
    showProgress,
    updateProgress,
    hideProgress,
    completeProgress,
    errorProgress
  };
}