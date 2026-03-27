import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Link, useLocation, useParams, useNavigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { useSettings } from '../../hooks/useSettings';
import { Menu, X } from 'lucide-react';
import {
  ServerStackIcon, WindowIcon, FolderIcon, GlobeAltIcon, PuzzlePieceIcon,
  CloudArrowDownIcon, UsersIcon, Cog6ToothIcon, CubeIcon,
  ArrowRightOnRectangleIcon, UserIcon, WalletIcon,
  EllipsisHorizontalIcon, CircleStackIcon,
  ListBulletIcon, ArrowLeftIcon, ArrowTrendingUpIcon, GiftIcon,
  FingerPrintIcon, HomeIcon, BoltIcon, PaperAirplaneIcon, ArrowDownLeftIcon,
  ChevronDownIcon, EllipsisVerticalIcon,
  ShieldCheckIcon, TicketIcon, SignalIcon, ServerIcon
} from '@heroicons/react/24/outline';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Sidebar context for visibility management
const SidebarContext = createContext({
  sidebarVisible: true,
  toggleSidebar: () => { }
});

export const useSidebar = () => useContext(SidebarContext);

const SidebarProvider = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SidebarContext.Provider value={{ sidebarVisible, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Enhanced Navigation Item with ref forwarding
const NavItem = ({ to, icon: Icon, label, isActive, setRef }) => {
  const id = to.replace(/\//g, '-').slice(1);
  const linkRef = useRef(null);

  useEffect(() => {
    if (linkRef.current) {
      setRef(id, linkRef.current);
    }
    return () => setRef(id, null);
  }, [id, setRef]);

  return (
    <Link
      to={to}
      ref={linkRef}
      className={`flex items-center h-8 px-2 text-xs rounded-md transition duration-300 relative z-10 outline-none active:scale-95 ${isActive
        ? 'text-white font-semibold'
        : 'hover:text-white text-white/50 border-none'
        }`}
    >
      {Icon && <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-white/60' : 'text-white/30'}`} />}
      <span>{label}</span>
    </Link>
  );
};

// Section Header component
const SectionHeader = ({ label }) => {
  return (
    <div className="px-3 pt-5 pb-1">
      <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">{label}</h3>
    </div>
  );
};

const MainLayout = () => {
  const [userData, setUserData] = useState({
    username: 'Loading...',
    id: '...',
    email: '...',
    global_name: ''
  });
  const { settings } = useSettings();
  const [balances, setBalances] = useState({ coins: 0 });
  const [servers, setServers] = useState([]);
  const [subuserServers, setSubuserServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const showServerSection = location.pathname.includes('/server/');

  // Sliding indicator animation logic - separate for user and admin navs
  const [activeTabId, setActiveTabId] = useState(null);
  const [userIndicatorStyle, setUserIndicatorStyle] = useState({
    width: 0, height: 0, top: 0, left: 0, opacity: 0,
  });
  const [adminIndicatorStyle, setAdminIndicatorStyle] = useState({
    width: 0, height: 0, top: 0, left: 0, opacity: 0,
  });

  const tabRefsMap = useRef({});
  const setTabRef = useCallback((id, element) => {
    tabRefsMap.current[id] = element;
  }, []);

  // Effect to track active tab changes
  useEffect(() => {
    const newTabId = location.pathname.replace(/\//g, '-').slice(1);
    if (activeTabId !== newTabId) {
      setActiveTabId(newTabId);
    }
  }, [location.pathname, activeTabId]);

  // Effect to update the indicator positions
  useEffect(() => {
    requestAnimationFrame(() => {
      if (activeTabId && tabRefsMap.current[activeTabId]) {
        const tabElement = tabRefsMap.current[activeTabId];
        if (!tabElement) return;

        const rect = tabElement.getBoundingClientRect();
        const navElement = tabElement.closest('nav');
        const navRect = navElement?.getBoundingClientRect();

        if (navRect) {
          const style = {
            width: rect.width,
            height: rect.height,
            top: rect.top - navRect.top,
            left: rect.left - navRect.left,
            opacity: 1,
          };

          // Check if this is an admin route
          const isAdminRoute = activeTabId.startsWith('admin-');

          if (isAdminRoute) {
            setAdminIndicatorStyle(style);
            setUserIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
          } else {
            setUserIndicatorStyle(style);
            setAdminIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
          }
        }
      }
    });
  }, [activeTabId]);

  useEffect(() => {
    if (showServerSection && id) {
      setSelectedServerId(id);
      // Find server name
      const allServers = (Array.isArray(servers) ? servers : []).concat(Array.isArray(subuserServers) ? subuserServers : []);
      const currentServer = allServers.find(
        server => server.id === id || (server.attributes && server.attributes.identifier === id)
      );

      if (currentServer) {
        setServerName(currentServer.name || (currentServer.attributes && currentServer.attributes.name));
      }
    }
  }, [id, showServerSection, servers, subuserServers]);

  // Navigation items for both Heliactyl sections
  const iconNavItems = [
    { icon: HomeIcon, label: 'Dashboard', path: '/' },
    { icon: ServerIcon, label: 'Servers', path: '/servers' },
    { icon: WalletIcon, label: 'Wallet', path: '/wallet' },
    { icon: CircleStackIcon, label: 'Store', path: '/coins/store' },
    { icon: GiftIcon, label: 'Daily rewards', path: '/coins/daily' },
    ...(settings?.features?.boosts !== false ? [{ icon: BoltIcon, label: 'Boosts', path: '/boosts' }] : []),
    { icon: TicketIcon, label: 'Support', path: '/support' }
  ];

  const serverNavItems = [
    { icon: WindowIcon, label: 'Overview', path: `/server/${id}/overview` },
    { icon: FolderIcon, label: 'Files', path: `/server/${id}/files` },
    { icon: GlobeAltIcon, label: 'Network', path: `/server/${id}/network` },
    { icon: CloudArrowDownIcon, label: 'Backups', path: `/server/${id}/backups` },
    { icon: UsersIcon, label: 'Players', path: `/server/${id}/players` },
    { icon: UsersIcon, label: 'Users', path: `/server/${id}/users` },
    { icon: Cog6ToothIcon, label: 'Settings', path: `/server/${id}/settings` },
    { icon: CubeIcon, label: 'Package', path: `/server/${id}/package` },
    { icon: PuzzlePieceIcon, label: 'Plugins', path: `/server/${id}/plugins` },
    { icon: ListBulletIcon, label: 'Logs', path: `/server/${id}/logs` }
  ];

  const adminNavItems = [
    { icon: WindowIcon, label: 'Overview', path: '/admin/overview' },
    { icon: ServerIcon, label: 'Servers', path: '/admin/servers' },
    { icon: UsersIcon, label: 'Users', path: '/admin/users' },
    { icon: ServerStackIcon, label: 'Locations & Nodes', path: '/admin/nodes' },
    { icon: CubeIcon, label: 'Eggs', path: '/admin/eggs' },
    { icon: TicketIcon, label: 'Tickets', path: '/admin/tickets' },
    { icon: SignalIcon, label: 'Radar', path: '/admin/radar' },
    { icon: CloudArrowDownIcon, label: 'Updater', path: '/admin/updater' }
  ];

  // Initial data loading - single consolidated call
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/v5/init');
        
        setBalances({ coins: data.coins || 0 });
        setUserData({
          username: data.user?.username || 'User',
          id: data.user?.id || '00000',
          email: data.user?.email || '...',
          global_name: data.user?.global_name || data.user?.username || 'User'
        });
        setIsAdmin(data.admin || false);
        setServers(data.servers || []);
        setSubuserServers(data.subuserServers || []);
      } catch (error) {
        console.error('Error fetching init data:', error);
      }
    };

    fetchData();
  }, []);

  function handleLogout() {
    try {
      axios.post('/api/user/logout')
        .then(() => navigate('/auth'))
        .catch((error) => console.error('Logout error:', error));
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const isActivePath = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#08090c] text-white">
        {/* Main container - Full width with no artificial centering */}
        <div className="w-full flex relative z-10">
          {/* Sidebar */}
          <aside className={`hidden lg:block sticky top-0 h-screen w-56 p-4 border-r border-white/5 bg-[#08090c] flex-shrink-0 relative transform transition-transform duration-300 ease-in-out ${useSidebar().sidebarVisible ? 'translate-x-0' : '-translate-x-full'
            }`}>
            {/* Sidebar content */}
            <div className="flex flex-col h-full relative z-10">
              {/* Logo and Toggle Button */}
              <div className="flex items-center justify-between px-4 h-16">
                <Link to="/dashboard" className="flex items-center gap-3 transition-transform duration-200 active:scale-95">
                  <span className="text-white font-semibold">{settings?.name || "Heliactyl"}</span>
                </Link>
              </div>

              {/* Server title when in server view */}
              {showServerSection && (
                <div className="py-2 px-4">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex text-white/70 hover:text-white transition duration-200 text-sm active:scale-95 items-center"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                    <span>Back to server list</span>
                  </button>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="flex-1 overflow-y-auto py-2">
                {/* Show section headers */}
                {!showServerSection ? (
                  <SectionHeader label="Navigation" />
                ) : (
                  <SectionHeader label="Server" />
                )}

                <nav className="py-1 px-3 space-y-0.5 relative">
                  {/* Animated background indicator */}
                  <div
                    className="absolute transform transition-all duration-200 ease-spring bg-[#383c47] rounded-md z-0"
                    style={{
                      width: `${userIndicatorStyle.width}px`,
                      height: `${userIndicatorStyle.height}px`,
                      top: `${userIndicatorStyle.top}px`,
                      left: `${userIndicatorStyle.left}px`,
                      opacity: userIndicatorStyle.opacity,
                      transitionDelay: '30ms',
                    }}
                  />

                  {/* Main nav items */}
                  {!showServerSection && (
                    <>
                      {iconNavItems.map((item) => (
                        <NavItem
                          key={item.label}
                          to={item.path}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActivePath(item.path)}
                          setRef={setTabRef}
                        />
                      ))}
                    </>
                  )}

                  {/* Server Navigation */}
                  {showServerSection && (
                    <>
                      {serverNavItems.map((item) => (
                        <NavItem
                          key={item.label}
                          to={item.path}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActivePath(item.path)}
                          setRef={setTabRef}
                        />
                      ))}
                    </>
                  )}
                </nav>

                {/* Admin Section */}
                {!showServerSection && isAdmin && (
                  <>
                    <SectionHeader label="Admin" />
                    <nav className="py-1 px-3 space-y-0.5 relative">
                      {/* Animated background indicator for admin section */}
                      <div
                        className="absolute transform transition-all duration-200 ease-spring bg-[#383c47] rounded-md z-0"
                        style={{
                          width: `${adminIndicatorStyle.width}px`,
                          height: `${adminIndicatorStyle.height}px`,
                          top: `${adminIndicatorStyle.top}px`,
                          left: `${adminIndicatorStyle.left}px`,
                          opacity: adminIndicatorStyle.opacity,
                          transitionDelay: '30ms',
                        }}
                      />
                      {adminNavItems.map((item) => (
                        <NavItem
                          key={item.label}
                          to={item.path}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActivePath(item.path)}
                          setRef={setTabRef}
                        />
                      ))}
                    </nav>
                  </>
                )}
              </div>

              {/* Bottom Section with user profile moved here */}
              <div>
                {/* Coins Balance Section */}
                <div className="px-4 py-3 bg-[#191b20]/50 rounded-xl mb-4">
                  <div className={`flex items-center justify-between ${settings?.features?.coinTransfer !== false ? 'mb-2' : ''}`}>
                    <span className="text-xs text-white/40">Coins</span>
                    <span className="text-xs font-medium text-white">{balances.coins.toFixed(2)}</span>
                  </div>
                  {settings?.features?.coinTransfer !== false && (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/wallet?action=send"
                        className="flex-1 flex items-center justify-center gap-1 text-[0.65rem] rounded-l-lg rounded-r font-medium bg-[#202229]/70 hover:bg-[#202229] text-white py-1.5 px-2 transition-all duration-200 active:scale-95"
                      >
                        <PaperAirplaneIcon className="w-3 h-3 mr-0.5 text-white/70" />
                        Send
                      </Link>
                      <Link
                        to="/wallet?action=receive"
                        className="flex-1 flex items-center justify-center gap-1 text-[0.65rem] rounded-r-lg rounded-l font-medium bg-[#202229]/70 hover:bg-[#202229] text-white py-1.5 px-2 transition-all duration-200 active:scale-95"
                      >
                        <ArrowDownLeftIcon className="w-3 h-3 mr-0.5 text-white/70" />
                        Receive
                      </Link>
                    </div>
                  )}
                </div>
                {/* User Profile Section */}
                <div className="flex items-center gap-3 border border-white/5 shadow-xs rounded-xl py-3 px-3">
                  <div className="h-7 w-7 bg-[#191b20] rounded-lg flex items-center justify-center">
                    <span className="text-xs text-white/70 font-semibold">
                      {getInitials(userData.global_name)}
                    </span>
                  </div>
                  <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex flex-col items-start cursor-pointer hover:text-white transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090c] rounded-md"
                      >
                        <span className="truncate max-w-[120px] text-sm font-medium">{userData.global_name}</span>
                        <span className="text-[0.55rem] uppercase max-w-[120px] truncate tracking-widest text-white/30 leading-none mt-0.3">
                          {userData.email}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-64 bg-[#202229] border border-white/5 rounded-xl shadow-lg text-white">
                      <div className="p-3 border-b border-white/5">
                        <p className="text-sm font-medium">{userData.username}</p>
                        <p className="text-xs text-[#95a1ad] mt-1">{userData.email}</p>
                      </div>
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer text-white hover:bg-white/5 transition-all duration-200 focus:bg-white/5"
                        onSelect={() => navigate('/account')}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span className="font-medium">My account</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer text-white hover:bg-white/5 transition-all duration-200 focus:bg-white/5"
                        onSelect={() => navigate('/passkeys')}
                      >
                        <FingerPrintIcon className="w-4 h-4" />
                        <span className="font-medium">Passkeys</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-white/5" />
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200 focus:bg-red-950/30 focus:text-red-300 cursor-pointer"
                        onSelect={handleLogout}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span className="font-medium">Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Powered by text - Bottom of sidebar */}
                <div className="relative py-4 md:pt-6 px-4">
                  <Link
                    to="https://github.com/re-heliactyl/"
                    className="text-[0.75rem] border-b font-mono border-white/10 pb-0.5 hover:border-white/15 text-white/40 transition hover:text-white/60"
                  >
                    v10.0.0 [toledo]
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-[#08090c] border-b border-white/5 flex items-center justify-between px-2 z-30">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(true)} 
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold">{settings?.name || "Heliactyl"}</span>
            <div className="w-10" />
          </header>

          {/* Mobile Navigation Drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-55 bg-[#08090c] p-0 border-r border-white/5">
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center justify-between px-2 h-12 border-b border-white/5">
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-white font-semibold">{settings?.name || "Heliactyl"}</span>
                  </Link>
                </div>

                {/* Server title when in server view */}
                {showServerSection && (
                  <div className="py-2 px-4 border-b border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="flex text-white/70 hover:text-white transition duration-200 text-sm items-center"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                      <span>Back to server list</span>
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4">
                  {!showServerSection ? (
                    <div className="px-4 mb-2">
                      <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">Navigation</h3>
                    </div>
                  ) : (
                    <div className="px-4 mb-2">
                      <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">Server</h3>
                    </div>
                  )}

                  <nav className="px-3 space-y-0.5">
                    {!showServerSection && iconNavItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center h-10 px-3 text-sm rounded-md transition-colors ${
                          isActivePath(item.path)
                            ? 'text-white bg-[#383c47]'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Link>
                    ))}

                    {showServerSection && serverNavItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center h-10 px-3 text-sm rounded-md transition-colors ${
                          isActivePath(item.path)
                            ? 'text-white bg-[#383c47]'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Admin Section */}
                  {!showServerSection && isAdmin && (
                    <>
                      <div className="px-4 mt-6 mb-2">
                        <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">Admin</h3>
                      </div>
                      <nav className="px-3 space-y-0.5">
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center h-10 px-3 text-sm rounded-md transition-colors ${
                              isActivePath(item.path)
                                ? 'text-white bg-[#383c47]'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <item.icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                    </>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="border-t border-white/5 p-4">
                  {/* Coins Balance *
                  <div className="hidden md:block px-4 py-3 bg-[#191b20]/50 rounded-xl mb-4">
                    <div className={`flex items-center justify-between ${settings?.features?.coinTransfer !== false ? 'mb-2' : ''}`}
                      <span className="text-xs text-white/40">Coins</span>
                      <span className="text-xs font-medium text-white">{balances.coins.toFixed(2)}</span>
                    </div>
                    {settings?.features?.coinTransfer !== false && (
                      <div className="flex items-center gap-2">
                        <Link
                          to="/wallet?action=send"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-1 text-[0.65rem] rounded-l-lg rounded-r font-medium bg-[#202229]/70 hover:bg-[#202229] text-white py-1.5 px-2 transition-all duration-200"
                        >
                          <PaperAirplaneIcon className="w-3 h-3 mr-0.5 text-white/70" />
                          Send
                        </Link>
                        <Link
                          to="/wallet?action=receive"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-1 text-[0.65rem] rounded-r-lg rounded-l font-medium bg-[#202229]/70 hover:bg-[#202229] text-white py-1.5 px-2 transition-all duration-200"
                        >
                          <ArrowDownLeftIcon className="w-3 h-3 mr-0.5 text-white/70" />
                          Receive
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="flex items-center gap-3 border border-white/5 rounded-xl py-3 px-3 mb-2">
                    <div className="h-8 w-8 bg-[#191b20] rounded-lg flex items-center justify-center">
                      <span className="text-xs text-white/70 font-semibold">
                        {getInitials(userData.global_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{userData.global_name}</p>
                      <p className="text-[0.6rem] text-white/40 truncate">{userData.email}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/account');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center text-white w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 rounded-md transition-colors"
                    >
                      <UserIcon className="w-4 h-4 mr-3" />
                      My account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/passkeys');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center text-white w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 rounded-md transition-colors"
                    >
                      <FingerPrintIcon className="w-4 h-4 mr-3" />
                      Passkeys
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>

                  {/* Version */}
                  <div className="mt-2 border-t border-white/5">
                    <Link
                      to="https://github.com/re-heliactyl/"
                      className="text-[0.7rem] font-mono text-white/40 hover:text-white/60 transition"
                    >
                      v10.0.0 [toledo]
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content - Full width */}
          <main className={`flex-1 min-w-0 transition-all duration-300 pt-14 lg:pt-0`}>
            <AnimatePresence mode="wait">
              <div className="py-6 px-2 md:py-10 md:px-8 lg:py-16 lg:px-16">
                <Outlet />
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Add CSS for spring animation 
// .ease-spring { transition-timing-function: cubic-bezier(0.5, 0, 0.2, 1.4); }

export default MainLayout;
