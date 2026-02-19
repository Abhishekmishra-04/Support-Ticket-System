
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  BarChart3, 
  Ticket as TicketIcon, 
  Search, 
  Filter, 
  Clock, 
  MoreVertical,
  ArrowUpDown,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';

// --- Types ---
type Category = 'billing' | 'technical' | 'account' | 'general';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: string;
}

interface Stats {
  total_tickets: number;
  open_tickets: number;
  avg_tickets_per_day: number;
  priority_breakdown: Record<Priority, number>;
  category_breakdown: Record<Category, number>;
}

// --- Mock Data / API Helpers ---
// Since I can't build a real Django backend in this environment easily, 
// I will simulate the API behavior including the "LLM suggestion" logic.

const CATEGORIES: Category[] = ['billing', 'technical', 'account', 'general'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: Status[] = ['open', 'in_progress', 'resolved', 'closed'];

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_COLORS = {
  open: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  resolved: 'bg-slate-100 text-slate-700',
  closed: 'bg-gray-100 text-gray-700',
};

// --- Components ---

export function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as Category,
    priority: 'low' as Priority
  });

  // Mock initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      const initialTickets: Ticket[] = [
        { id: '1', title: 'Payment failed', description: 'Trying to upgrade but the card was declined twice.', category: 'billing', priority: 'high', status: 'open', created_at: new Date().toISOString() },
        { id: '2', title: 'Login loop', description: 'I keep getting redirected to login after signing in.', category: 'account', priority: 'critical', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', title: 'Documentation typo', description: 'Found a typo in the API docs page.', category: 'general', priority: 'low', status: 'resolved', created_at: new Date(Date.now() - 172800000).toISOString() },
      ];
      setTickets(initialTickets);
      updateStats(initialTickets);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const updateStats = (currentTickets: Ticket[]) => {
    const statsObj: Stats = {
      total_tickets: currentTickets.length,
      open_tickets: currentTickets.filter(t => t.status === 'open').length,
      avg_tickets_per_day: +(currentTickets.length / 7).toFixed(1),
      priority_breakdown: {
        low: currentTickets.filter(t => t.priority === 'low').length,
        medium: currentTickets.filter(t => t.priority === 'medium').length,
        high: currentTickets.filter(t => t.priority === 'high').length,
        critical: currentTickets.filter(t => t.priority === 'critical').length,
      },
      category_breakdown: {
        billing: currentTickets.filter(t => t.category === 'billing').length,
        technical: currentTickets.filter(t => t.category === 'technical').length,
        account: currentTickets.filter(t => t.category === 'account').length,
        general: currentTickets.filter(t => t.category === 'general').length,
      }
    };
    setStats(statsObj);
  };

  const handleClassify = async (description: string) => {
    if (!description || description.length < 10) return;
    setIsClassifying(true);
    
    // Simulating LLM API call
    // In real app: axios.post('/api/tickets/classify/', { description })
    try {
      await new Promise(r => setTimeout(r, 1200));
      const lowerDesc = description.toLowerCase();
      let suggestedCategory: Category = 'general';
      let suggestedPriority: Priority = 'medium';

      if (lowerDesc.includes('money') || lowerDesc.includes('billing') || lowerDesc.includes('payment') || lowerDesc.includes('refund')) {
        suggestedCategory = 'billing';
        suggestedPriority = 'high';
      } else if (lowerDesc.includes('bug') || lowerDesc.includes('error') || lowerDesc.includes('crash') || lowerDesc.includes('not working')) {
        suggestedCategory = 'technical';
        suggestedPriority = 'high';
      } else if (lowerDesc.includes('password') || lowerDesc.includes('login') || lowerDesc.includes('account')) {
        suggestedCategory = 'account';
      }

      if (lowerDesc.includes('urgent') || lowerDesc.includes('immediate') || lowerDesc.includes('emergency')) {
        suggestedPriority = 'critical';
      }

      setFormData(prev => ({ ...prev, category: suggestedCategory, priority: suggestedPriority }));
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'open',
      created_at: new Date().toISOString()
    };
    const newTickets = [newTicket, ...tickets];
    setTickets(newTickets);
    updateStats(newTickets);
    setFormData({ title: '', description: '', category: 'general', priority: 'low' });
    setShowForm(false);
  };

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    const newTickets = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(newTickets);
    updateStats(newTickets);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesCategory = !filterCategory || t.category === filterCategory;
      const matchesPriority = !filterPriority || t.priority === filterPriority;
      const matchesStatus = !filterStatus || t.status === filterStatus;
      const matchesSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
    });
  }, [tickets, filterCategory, filterPriority, filterStatus, searchQuery]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TicketIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              SupportFlow
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Dashboard */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Total Tickets</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.total_tickets || 0}</h3>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Open Now</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-600">{stats?.open_tickets || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Category Distribution</h2>
            </div>
            <div className="h-48 w-full">
              {stats && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.category_breakdown).map(([name, value]) => ({ name, value }))}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(stats.category_breakdown).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {CATEGORIES.map((cat, i) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="capitalize">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Priority Levels</h2>
            </div>
            <div className="space-y-3">
              {stats && PRIORITIES.map(priority => {
                const count = stats.priority_breakdown[priority];
                const percentage = stats.total_tickets ? (count / stats.total_tickets) * 100 : 0;
                return (
                  <div key={priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize">{priority}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          priority === 'critical' ? 'bg-red-500' : 
                          priority === 'high' ? 'bg-orange-400' :
                          priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Column: Ticket List */}
        <section className="lg:col-span-8 space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No tickets found</h3>
                <p className="text-slate-500">Try adjusting your filters or create a new ticket.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    ticket.priority === 'critical' ? 'bg-red-500' : 
                    ticket.priority === 'high' ? 'bg-orange-400' :
                    ticket.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-slate-400 text-xs">#{ticket.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(ticket.id, e.target.value as Status)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${STATUS_COLORS[ticket.status]}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                    {ticket.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Filter className="w-3.5 h-3.5" />
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{format(new Date(ticket.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Submit Support Ticket</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <PlusCircle className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Title</label>
                <input 
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Summarize the issue"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Describe your problem in detail..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  onBlur={() => handleClassify(formData.description)}
                />
                {isClassifying && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI is analyzing your issue...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formData.priority}
                      onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Create Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
