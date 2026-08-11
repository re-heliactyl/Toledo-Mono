import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// MainLayout stays eager — it's the app shell rendered on every protected route
import MainLayout from '@/components/layouts/MainLayout';

// Lazy-loaded page components (code-split per route)
const Overview = React.lazy(() => import('@/pages/server/Overview'));
const FileManagerPage = React.lazy(() => import('./pages/server/FileManagerPage'));
const PluginManagerPage = React.lazy(() => import('./pages/server/PluginManagerPage'));
const Network = React.lazy(() => import('./pages/server/Network'));
const Subdomains = React.lazy(() => import('./pages/server/Subdomains'));
const UserManagerPage = React.lazy(() => import('./pages/server/UserManagerPage'));
const Players = React.lazy(() => import('./pages/server/Players'));
const Backups = React.lazy(() => import('./pages/server/Backups'));
const Settings = React.lazy(() => import('./pages/server/Settings'));
const Package = React.lazy(() => import('./pages/server/Package'));
const Logs = React.lazy(() => import('./pages/server/Logs'));

const Website = React.lazy(() => import('./pages/Website'));
const Banned = React.lazy(() => import('./pages/Banned'));

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ServersPage = React.lazy(() => import('./pages/Servers'));
const Auth = React.lazy(() => import('./pages/Auth'));
const TwoFactorVerification = React.lazy(() => import('./pages/TwoFactorVerification'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Boosts = React.lazy(() => import('./pages/Boosts'));

const AFKPage = React.lazy(() => import('./pages/coins/AFKPage'));
const Store = React.lazy(() => import('./pages/coins/Store'));
const Staking = React.lazy(() => import('./pages/coins/Staking'));
const Daily = React.lazy(() => import('./pages/coins/Daily'));
const Wallet = React.lazy(() => import('./pages/coins/Wallet'));
const BillingSuccess = React.lazy(() => import('./pages/billing/Success'));
const AccountPage = React.lazy(() => import('./pages/Account'));
const PasskeyManager = React.lazy(() => import('./pages/Passkeys'));

const AdminOverview = React.lazy(() => import('./pages/admin/Overview'));
const AdminServers = React.lazy(() => import('./pages/admin/Servers'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminNodes = React.lazy(() => import('./pages/admin/Nodes'));
const AdminTickets = React.lazy(() => import('./pages/admin/Tickets'));
const AdminRadar = React.lazy(() => import('./pages/admin/Radar'));
const AdminEggs = React.lazy(() => import('./pages/admin/Eggs'));
const AdminUpdater = React.lazy(() => import('./pages/admin/Updater'));

const Support = React.lazy(() => import('./pages/Support'));

// Suspense fallback matching the app's dark theme
const PageFallback = () => (
  <div className="min-h-screen bg-[#101218] flex items-center justify-center p-4">
    <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      countdown: 15
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hasError && !prevState.hasError) {
      this.startCountdown();
    }
  }

  startCountdown = () => {
    this.countdownInterval = setInterval(() => {
      this.setState(state => ({
        countdown: state.countdown - 1
      }), () => {
        if (this.state.countdown === 0) {
          clearInterval(this.countdownInterval);
          window.location.reload();
        }
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  handleRefreshNow = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong with {this.props.siteName || "Heliactyl"}</CardTitle>
              </div>
              <CardDescription>
                An error occurred while rendering the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-xs md:text-sm font-mono overflow-auto max-h-[200px]">
                {this.state.error?.message || 'Unknown error'}
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="system-info">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      System information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Version: {this.props.siteName || "Heliactyl"} 10.x.x</p>
                      <p>Codename: Toledo</p>
                      <p>Platform: 305</p>
                      <p>User Agent: {navigator.userAgent}</p>
                      <p>Timestamp: {new Date().toISOString()}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Refreshing in {this.state.countdown}...
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRefreshNow}
                  className="gap-2 text-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root redirect component that checks the origin and routes accordingly
const RootRedirect = () => {
  // Get the current hostname
  const hostname = window.location.hostname;

  // Check if it's the console subdomain
  if (hostname === 'console.altare.pro') {
    return <Navigate to="/dashboard" replace />;
  }

  // If it's the main domain or www subdomain, show the website
  if (hostname === 'altare.pro' || hostname === 'www.altare.pro') {
    return <Website />;
  }

  // Default to dashboard for any other domain/subdomain
  return <Navigate to="/dashboard" replace />;
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v5/state', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (data.banned) {
          navigate('/banned', { replace: true });
          return;
        }

        if (data.twoFactorPending) {
          setRequires2FA(true);
          navigate('/auth/2fa', {
            state: {
              redirectUrl: window.location.pathname
            }
          });
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth';
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#101218] flex items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
      </div>
    );
  }

  if (requires2FA) {
    return null; // Will redirect to 2FA page
  }

  return children;
};

export default function App() {
  // Get hostname to determine if we need to render the console or website
  const [isWebsite, setIsWebsite] = useState(false);
  const { settings } = useSettings();
  const siteName = settings?.name || "Heliactyl";

  useEffect(() => {
    if (settings?.name) {
      document.title = settings.name;
    }
  }, [settings]);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsWebsite(hostname === 'altare.pro' || hostname === 'www.altare.pro');
  }, []);

  // If it's the main website domain, render the Website component directly
  if (isWebsite) {
    return (
      <ErrorBoundary siteName={siteName}>
        <div className="dark text-white">
          <Suspense fallback={<PageFallback />}>
            <Website />
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  // Otherwise render the console application
  return (
    <ErrorBoundary siteName={siteName}>
      <div className="dark text-white bg-[#151719] overflow-x-clip">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Root route with conditional redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/2fa" element={<TwoFactorVerification />} />
          <Route path="/banned" element={<Banned />} />

          {/* Protected routes with MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Server routes */}
            <Route path="/server/:id/overview" element={<Overview />} />
            <Route path="/server/:id/files" element={<FileManagerPage />} />
            <Route path="/server/:id/plugins" element={<PluginManagerPage />} />
            <Route path="/server/:id/network" element={<Network />} />
            <Route path="/server/:id/subdomains" element={<Subdomains />} />
            <Route path="/server/:id/users" element={<UserManagerPage />} />
            <Route path="/server/:id/players" element={<Players />} />
            <Route path="/server/:id/backups" element={<Backups />} />
            <Route path="/server/:id/settings" element={<Settings />} />
            <Route path="/server/:id/package" element={<Package />} />
            <Route path="/server/:id/logs" element={<Logs />} />

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servers" element={<ServersPage />} />
            <Route path="/coins/afk" element={<AFKPage />} />
            <Route path="/coins/store" element={<Store />} />
            <Route path="/coins/staking" element={<Staking />} />
            <Route path="/coins/daily" element={<Daily />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/billing/success" element={<BillingSuccess />} />
            <Route path="/billing/subscription-success" element={<BillingSuccess />} />

            <Route path="/account" element={<AccountPage />} />
            <Route path="/passkeys" element={<PasskeyManager />} />
            <Route path="/support" element={<Support />} />

            {/* Others */}
            <Route path="/boosts" element={<Boosts />} />

            {/* Admin routes */}
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/servers" element={<AdminServers />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/nodes" element={<AdminNodes />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/radar" element={<AdminRadar />} />
            <Route path="/admin/eggs" element={<AdminEggs />} />
            <Route path="/admin/updater" element={<AdminUpdater />} />
          </Route>

          {/* 404 catch-all route */}
          <Route path="*" element={<NotFound />} />
          <Route path="/website" element={<Website />} />
        </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
