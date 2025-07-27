import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Menu, X, User, MapPin, LogOut, Heart, BookOpen, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

interface NavbarProps {
  selectedCity?: string;
  onCitySelect?: () => void;
  onSearch?: (query: string) => void;
  onFilterToggle?: () => void;
  notifications?: any[];
  showNotifDropdown?: boolean;
  setShowNotifDropdown?: (v: boolean) => void;
  clearNotifications?: () => void;
}

const Navbar = ({
  selectedCity,
  onCitySelect,
  onSearch,
  onFilterToggle,
  notifications = [],
  showNotifDropdown = false,
  setShowNotifDropdown = () => {},
  clearNotifications = undefined,
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleAuthClick = (tab: "login" | "register") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Help & Support", path: "/help" },
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16">
            {/* Logo at the far left */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-cricket rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-cricket-green rounded-md"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-cricket-green group-hover:text-cricket-green/80 transition-colors">
                  BoxCric
                </h1>
                <p className="text-xs text-gray-500 -mt-1 font-medium">Book. Play. Win.</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-gray-700 hover:text-cricket-green transition-colors duration-200 font-medium relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cricket-green transition-all duration-200 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Search Bar and Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Location Selector */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCitySelect}
                className="flex items-center space-x-2 hover:bg-cricket-green/5 hover:border-cricket-green/20 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedCity || "Select City"}</span>
              </Button>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search grounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 pl-10 pr-4 border-gray-200 focus:border-cricket-green focus:ring-cricket-green/20"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>

              {/* Filter */}
              {onFilterToggle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFilterToggle}
                  className="flex items-center space-x-2 hover:bg-cricket-green/5 hover:border-cricket-green/20 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden lg:inline">Filters</span>
                </Button>
              )}

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="relative bg-white rounded-full shadow-lg p-2 hover:bg-gray-100 transition-all"
                      aria-label="Show notifications"
                    >
                      <Bell className="w-6 h-6 text-cricket-green" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{notifications.length}</span>
                      )}
                    </button>
                    {/* Notification Dropdown with overlay and improved style */}
                    {showNotifDropdown && (
                      <>
                        {/* Overlay */}
                        <div
                          className="fixed inset-0 bg-black/20 z-40"
                          onClick={() => setShowNotifDropdown(false)}
                        />
                        {/* Dropdown - fixed to right side below bell */}
                        <div className="fixed top-20 right-8 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-in flex flex-col" style={{ minWidth: 320 }}>
                          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                            <span className="font-semibold text-lg text-gray-900">Notifications</span>
                            <button onClick={() => setShowNotifDropdown(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
                          </div>
                          <div className="overflow-y-auto max-h-96 px-3 py-2">
                            {notifications.length === 0 && (
                              <div className="text-center text-gray-500 py-8">No notifications</div>
                            )}
                            {notifications.map((notif) => (
                              <div key={notif.id} className={`rounded-lg p-4 mb-2 flex items-center gap-4 ${notif.status === 'confirmed' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
                                <div className="flex-shrink-0">
                                  {notif.status === 'confirmed' ? (
                                    <span className="inline-block w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xl">✔️</span>
                                  ) : (
                                    <span className="inline-block w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xl">❌</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-lg">
                                    {notif.status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Cancelled'}
                                  </div>
                                  <div className="text-gray-700 text-sm mt-1">
                                    <b>Ground:</b> {notif.ground}<br />
                                    <b>Date:</b> {notif.date ? new Date(notif.date).toLocaleDateString() : ''}<br />
                                    <b>Time:</b> {notif.time}
                                    {notif.status === 'cancelled' && notif.reason && (
                                      <div className="text-red-700 mt-1"><b>Reason:</b> {notif.reason}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {clearNotifications && notifications.length > 0 && (
                            <button
                              onClick={() => { clearNotifications(); setShowNotifDropdown(false); }}
                              className="text-gray-500 hover:text-red-600 text-sm py-2 border-t border-gray-100 w-full bg-transparent font-medium rounded-b-2xl transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-3 h-10 hover:bg-gray-100"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-cricket-green text-white text-sm font-semibold">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name.split(" ")[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-cricket-green text-white">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile/bookings")}>
                        <BookOpen className="w-4 h-4 mr-3" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Heart className="w-4 h-4 mr-3" />
                        Favorites
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAuthClick("login")}
                    className="hover:text-cricket-green transition-colors"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="bg-cricket-green hover:bg-cricket-green/90 text-white font-semibold px-6"
                    onClick={() => handleAuthClick("register")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-md">
              <div className="space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search grounds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 border-gray-200 focus:border-cricket-green"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </form>

                {/* Mobile Location and Filter */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCitySelect}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedCity || "Select City"}
                    </span>
                  </Button>
                  {onFilterToggle && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onFilterToggle}
                      className="flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                    </Button>
                  )}
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-3 py-2 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-md transition-colors duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth */}
                {isAuthenticated && user ? (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-cricket-green text-white font-semibold">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-md transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      My Profile
                    </Link>
                    <Link
                      to="/profile/bookings"
                      className="block px-3 py-2 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-md transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      My Bookings
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 py-2 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-md transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        handleAuthClick("login");
                        setIsMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      className="flex-1 bg-cricket-green hover:bg-cricket-green/90 text-white font-semibold"
                      onClick={() => {
                        handleAuthClick("register");
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  );
};

export default Navbar;