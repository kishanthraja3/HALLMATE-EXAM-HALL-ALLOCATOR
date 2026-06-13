import React, { useState, useReducer, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, MapPin, GitBranch, History, Settings, Users, Info, 
  Search, Bell, HelpCircle, ChevronRight, Calendar, Clock, CheckCircle2, 
  X, FileText, User, Building, Eye, Download, Play, Check, AlertCircle, Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- VALIDATION HELPER ---
const validateCSV = async (file, type) => {
  if (!file) return null;
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return "File is empty";
    const headers = lines[0].toLowerCase().split(',').map(h=>h.trim());
    
    if (type === 'students') {
      const reqS = ['name', 'roll_no', 'dept', 'year', 'degree', 'subject_code'];
      const missing = reqS.filter(req => {
        if (req === 'roll_no') return !headers.includes('roll_no') && !headers.includes('rollno');
        return !headers.includes(req);
      });
      if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
    } else if (type === 'teachers') {
      const reqT = ['teacher_name', 'teacher_id'];
      const missing = reqT.filter(req => !headers.includes(req) && !headers.includes(req.replace('_','')));
      if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
    } else if (type === 'rooms') {
      const roomIdx = headers.findIndex(h => h.includes('room'));
      if (roomIdx === -1) return "Missing 'room_no' column";
    }
    return null; // No errors
  } catch (e) {
    return "Error reading file";
  }
};

// --- INITIAL DATA & STATE ---

const initialRules = {
  maxPerBench: 2,
  deptMixing: true,
  maxPerHall: 60,
  visibilityOffset: 120,
  historyDays: 14
};

const initialAllocations = [
  { id: 1, date: '2026-04-18', startTime: '09:00', endTime: '12:00', students: 1240, rooms: 32, publishedAt: '2026-04-16 10:00' },
  { id: 2, date: '2026-04-19', startTime: '14:00', endTime: '17:00', students: 850, rooms: 24, publishedAt: '2026-04-17 11:30' },
  { id: 3, date: '2026-04-20', startTime: '09:00', endTime: '12:00', students: 1508, rooms: 42, publishedAt: '2026-04-18 16:45' }
];

const initialHallAssignments = [
  {
    id: 1, date: '2026-04-18', startTime: '09:00', endTime: '12:00', deadline: '2026-04-17 18:00',
    rooms: [
      { no: 'A101', checker: 'Dr. Ramesh Kumar', assignedAt: '2026-04-16 10:23', status: 'Verified' },
      { no: 'A102', checker: 'Prof. Sunita Rao', assignedAt: '2026-04-16 10:23', status: 'Verified' },
    ]
  },
  {
    id: 2, date: '2026-04-19', startTime: '09:00', endTime: '12:00', deadline: '2026-04-18 18:00',
    rooms: [
      { no: 'A101', checker: 'Dr. Ramesh Kumar', assignedAt: '2026-04-18 10:23', status: 'Verified' },
      { no: 'A102', checker: 'Prof. Sunita Rao', assignedAt: '2026-04-18 10:23', status: 'Verified' },
      { no: 'A103', checker: 'Dr. Anil Mehta', assignedAt: '2026-04-18 10:23', status: 'Verified' },
      { no: 'B201', checker: 'Prof. Kavitha S', assignedAt: '2026-04-18 10:24', status: 'In Progress' },
      { no: 'B202', checker: 'Dr. Priya Nair', assignedAt: '2026-04-18 10:24', status: 'In Progress' },
      { no: 'B203', checker: 'Prof. Suresh Babu', assignedAt: '2026-04-18 10:24', status: 'Pending' },
      { no: 'C301', checker: 'Dr. Meena Iyer', assignedAt: '2026-04-18 10:25', status: 'Pending' },
      { no: 'C302', checker: 'Prof. Rajan T', assignedAt: '2026-04-18 10:25', status: 'Pending' },
      { no: 'C303', checker: 'Dr. Lakshmi V', assignedAt: '2026-04-18 10:25', status: 'Verified' },
    ]
  }
];

const initialAlterations = [
  { id: 1, teacher: 'Prof. Sunita Rao', tId: 'T1042', room: 'A102', date: '2026-04-20', reason: 'Medical leave — doctor prescribed...', alt: 'T1087', status: 'Pending' },
  { id: 2, teacher: 'Dr. Anil Mehta', tId: 'T1019', room: 'B201', date: '2026-04-21', reason: 'Family emergency, unable to attend...', alt: 'none', status: 'Pending' },
  { id: 3, teacher: 'Prof. Kavitha S', tId: 'T1055', room: 'C301', date: '2026-04-19', reason: 'Conference attendance approved...', alt: 'T1033', status: 'Approved' },
  { id: 4, teacher: 'Dr. Priya Nair', tId: 'T1071', room: 'A103', date: '2026-04-22', reason: 'Personal reasons', alt: 'none', status: 'Rejected' },
  { id: 5, teacher: 'Prof. Suresh Babu', tId: 'T1028', room: 'D401', date: '2026-04-23', reason: 'Out of station for official duty...', alt: 'T1062', status: 'Pending' },
];

const CHECKERS = ['Dr. Ramesh Kumar', 'Prof. Sunita Rao', 'Dr. Anil Mehta', 'Prof. Kavitha S', 'Dr. Priya Nair', 'Prof. Suresh Babu'];

const deptData = [
  { name: 'CSE', count: 312 }, { name: 'ECE', count: 278 }, { name: 'MECH', count: 245 },
  { name: 'CIVIL', count: 198 }, { name: 'EEE', count: 167 }, { name: 'IT', count: 143 },
  { name: 'CHEM', count: 89 }, { name: 'BIO', count: 76 }
];

// --- REDUCER ---

function appReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentPage: action.payload };
    case 'UPDATE_RULES':
      return { ...state, rules: { ...state.rules, ...action.payload } };
    case 'ADD_ALLOCATION':
      return { ...state, allocations: [action.payload, ...state.allocations] };
    case 'ADD_HALL_ASSIGNMENT':
      return { ...state, hallAssignments: [...state.hallAssignments, action.payload] };
    case 'UPDATE_ALTERATION_STATUS':
      return {
        ...state,
        alterationRequests: state.alterationRequests.map(req =>
          req.id === action.payload.id ? { ...req, status: action.payload.status } : req
        )
      };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

// --- COMPONENTS ---

const Badge = ({ children, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

// --- PAGES ---

function Dashboard({ state }) {
  const [selectedDate, setSelectedDate] = useState('2026-04-19');
  
  const metrics = useMemo(() => {
    const alloc = state.allocations.find(a => a.date === selectedDate) || { students: 0 };
    const assign = state.hallAssignments.find(a => a.date === selectedDate) || { rooms: [] };
    const checkers = new Set(assign.rooms.map(r => r.checker)).size;
    const pendingVerifications = assign.rooms.filter(r => r.status !== 'Verified').length;
    return { students: alloc.students, rooms: assign.rooms.length, checkers, pendingVerifications };
  }, [state.allocations, state.hallAssignments, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Students</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{metrics.students}</p>
          <p className="text-xs text-green-600 mt-1 font-medium">+4.2% vs last exam</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Rooms Assigned</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{metrics.rooms}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Hall Checkers</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{metrics.checkers}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Pending Verifications</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{metrics.pendingVerifications}</p>
          {metrics.pendingVerifications > 0 && <p className="text-xs text-amber-600 mt-1 font-medium">Deadline in 2 days</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Students per Department</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} width={50} />
              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subjects Being Written</h3>
          <div className="flex flex-wrap gap-2 flex-grow overflow-y-auto content-start">
            {['CS312 - Operating Systems', 'EE278 - Signals & Systems', 'ME245 - Thermodynamics', 'CV198 - Structural Analysis', 'IT143 - Web Tech', 'CH089 - Organic Chem'].map(sub => (
              <span key={sub} className="px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-full text-sm font-medium">
                {sub}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 border-t pt-3">6 subjects scheduled for this date.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <a href="#" className="text-sm text-blue-600 hover:underline">View all</a>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-sm text-gray-800">Room A101 verified by Dr. Ramesh Kumar</p>
              <p className="text-xs text-gray-500">10 min ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-800">New allocation published for Apr 19 09:00–12:00</p>
              <p className="text-xs text-gray-500">1 hr ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HallAssignment({ state, dispatch }) {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Modal Form State
  const [newDate, setNewDate] = useState('');
  const [newTimeFrom, setNewTimeFrom] = useState('');
  const [newTimeTo, setNewTimeTo] = useState('');
  const [newRooms, setNewRooms] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  
  const handleCreateAssignment = () => {
    const roomList = newRooms.split(',').map(r => r.trim()).filter(r => r);
    if (roomList.length === 0) return;
    
    // Auto-assign round robin
    const rooms = roomList.map((no, idx) => ({
      no,
      checker: CHECKERS[idx % CHECKERS.length],
      assignedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Pending'
    }));
    
    // Max 15 rooms per checker validation
    const checkerCounts = {};
    for (const r of rooms) {
      checkerCounts[r.checker] = (checkerCounts[r.checker] || 0) + 1;
      if (checkerCounts[r.checker] > 15) {
        alert("Cannot assign more than 15 rooms per checker. Please reduce room count or add checkers.");
        return;
      }
    }

    const newBatch = {
      id: Date.now(),
      date: newDate,
      startTime: newTimeFrom,
      endTime: newTimeTo,
      deadline: newDeadline.replace('T', ' '),
      rooms
    };

    dispatch({ type: 'ADD_HALL_ASSIGNMENT', payload: newBatch });
    setShowModal(false);
    setNewDate(''); setNewTimeFrom(''); setNewTimeTo(''); setNewRooms(''); setNewDeadline('');
    dispatch({ type: 'SHOW_TOAST', payload: { message: "Assignment created successfully", type: "success" } });
  };

  if (selectedBatch) {
    return <HallAssignmentDetail batch={selectedBatch} onBack={() => setSelectedBatch(null)} />;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Hall Assignment</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
          + New Assignment
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Exam Date</th>
              <th className="px-6 py-4">Timing</th>
              <th className="px-6 py-4">Total Rooms</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.hallAssignments.map(batch => {
              const total = batch.rooms.length;
              const verified = batch.rooms.filter(r => r.status === 'Verified').length;
              const isAllDone = verified === total;
              return (
                <tr key={batch.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedBatch(batch)}>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{batch.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.startTime} – {batch.endTime}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{total}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.deadline}</td>
                  <td className="px-6 py-4">
                    {isAllDone ? (
                      <Badge color="green">All Done</Badge>
                    ) : (
                      <span className="text-sm font-medium text-gray-600"><span className="text-green-600 font-bold">{verified}</span> / {total} done</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                    <span onClick={(e) => { e.stopPropagation(); setSelectedBatch(batch); }} className="hover:underline cursor-pointer">View Details →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Assignment</h3>
                <p className="text-sm text-gray-500">Rooms auto-assigned round-robin (max 15 per checker)</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Exam Date</label>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Time From</label>
                  <input type="time" value={newTimeFrom} onChange={e=>setNewTimeFrom(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Time To</label>
                  <input type="time" value={newTimeTo} onChange={e=>setNewTimeTo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Room Numbers</label>
                <textarea rows={3} placeholder="A101, A102, B201, B202..." value={newRooms} onChange={e=>setNewRooms(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Deadline</label>
                <input type="datetime-local" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateAssignment} disabled={!newDate || !newTimeFrom || !newTimeTo || !newRooms || !newDeadline} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">Create Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HallAssignmentDetail({ batch, onBack }) {
  const [filter, setFilter] = useState('All');

  const filteredRooms = filter === 'All' ? batch.rooms : batch.rooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center text-sm font-medium">
          <ChevronRight size={16} className="rotate-180 mr-1"/> Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Batch: {batch.date}</h2>
        <span className="text-sm text-gray-500 ml-4 font-medium">{batch.startTime} – {batch.endTime} <span className="mx-2">|</span> Deadline: {batch.deadline}</span>
      </div>

      <div className="flex gap-2">
        {['All', 'Verified', 'In Progress', 'Pending'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f ? (f==='Verified'?'bg-green-100 border-green-200 text-green-700':f==='In Progress'?'bg-amber-100 border-amber-200 text-amber-700':f==='Pending'?'bg-red-100 border-red-200 text-red-700':'bg-blue-100 border-blue-200 text-blue-700') 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Room No</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Assigned At</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRooms.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.no}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.checker}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.assignedAt}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{batch.deadline}</td>
                <td className="px-6 py-4">
                  <Badge color={r.status === 'Verified' ? 'green' : r.status === 'In Progress' ? 'amber' : 'red'}>{r.status}</Badge>
                </td>
              </tr>
            ))}
            {filteredRooms.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">No rooms found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocatorWizard({ state, dispatch }) {
  const [step, setStep] = useState(1);
  const [wizState, setWizState] = useState({
    date: '', startTime: '', endTime: '',
    csv1: null, csv2: null, csv3: null,
    csvErrors: { csv1: null, csv2: null, csv3: null },
    roomsData: [],
    roomLayouts: {}, // { roomNo: { confirmed: boolean, seats: [{id: 'A1', avail: true}] } }
    studentsCount: 0,
    subjectCounts: {},
    processing: false,
    sessionId: null
  });
  const [duplicateError, setDuplicateError] = useState(false);

  // Initialize room layouts when reaching step 3
  useEffect(() => {
    if (step === 3 && Object.keys(wizState.roomLayouts).length === 0) {
      const layouts = {};
      wizState.roomsData.forEach(r => {
        // Generate seats
        const seats = [];
        const rows = ['A','B','C','D','E'];
        for(let c=0; c<rows.length; c++) {
          for(let rNum=1; rNum<=8; rNum++) {
            seats.push({ id: `${rows[c]}${rNum}`, avail: true });
          }
        }
        
        // check if room is verified in state.hallAssignments
        let isVerified = false;
        state.hallAssignments.forEach(batch => {
          batch.rooms.forEach(br => { if(br.no === r && br.status === 'Verified') isVerified = true; });
        });

        if (isVerified) {
          // block 5 random seats
          for(let i=0; i<5; i++) seats[Math.floor(Math.random()*40)].avail = false;
        }

        layouts[r] = { confirmed: false, isVerified, seats };
      });
      setWizState(s => ({...s, roomLayouts: layouts}));
    }
  }, [step, wizState.roomsData, state.hallAssignments, wizState.roomLayouts]);

  const handleStep1Proceed = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/sessions/check-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_date: wizState.date, time_from: wizState.startTime, time_to: wizState.endTime })
      });
      if (res.status === 409) {
        setDuplicateError(true);
      } else if (!res.ok) {
        const err = await res.json();
        alert("Backend Error: " + (err.error || "Unknown"));
      } else {
        setDuplicateError(false);
        setStep(2);
      }
    } catch (err) {
      alert("Error connecting to backend");
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/sessions/${wizState.sessionId}/publish`, {
        method: 'POST'
      });
      if (res.ok) {
        dispatch({ type: 'SHOW_TOAST', payload: { message: "Allocation published successfully.", type: "success" } });
        dispatch({ type: 'NAVIGATE', payload: 'History' });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to publish");
      }
    } catch (e) {
      alert("Error publishing");
    }
  };

  const renderStepIndicator = () => {
    const steps = ['DATE & TIME', 'UPLOAD CSVS', 'ROOM LAYOUTS', 'CONFIRM', 'PROCESSING'];
    return (
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
        {steps.map((label, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={num} className="relative z-10 flex flex-col items-center gap-2 bg-gray-50 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                isDone ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}>
                {isDone ? <Check size={16} /> : num}
              </div>
              <span className={`text-xs font-bold tracking-wider ${isActive||isDone ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {renderStepIndicator()}
      
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4"><Calendar size={24}/></div>
            <h3 className="text-xl font-bold text-gray-900">Configure Exam Session</h3>
            <p className="text-sm text-gray-500 mt-1">Set the date and time window for this allocation.</p>
          </div>
          
          {duplicateError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5"/>
              <p className="text-sm">An allocation already exists for this date and time slot. Please choose a different slot.</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Exam Date</label>
              <input type="date" value={wizState.date} onChange={e=>setWizState({...wizState, date: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <input type="time" value={wizState.startTime} onChange={e=>setWizState({...wizState, startTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                <input type="time" value={wizState.endTime} onChange={e=>setWizState({...wizState, endTime: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>
            <button 
              onClick={handleStep1Proceed}
              disabled={!wizState.date || !wizState.startTime || !wizState.endTime}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-md mt-4 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Proceed to Upload CSVs &rarr;
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Upload CSV Files</h3>
            <p className="text-sm text-gray-500 mt-1">Upload the required data files for this allocation.</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <CsvCard type="Students CSV" icon={<FileText size={24} className="text-blue-500"/>} req="name, rollno, dept, year, degree, subject_code" file={wizState.csv1} error={wizState.csvErrors.csv1} onFileChange={async (f)=>{
              const err = await validateCSV(f, 'students');
              setWizState(s => ({...s, csv1: f, csvErrors: {...s.csvErrors, csv1: err}}));
            }}/>
            <CsvCard type="Teachers CSV" icon={<User size={24} className="text-orange-500"/>} req="name, id" file={wizState.csv2} error={wizState.csvErrors.csv2} onFileChange={async (f)=>{
              const err = await validateCSV(f, 'teachers');
              setWizState(s => ({...s, csv2: f, csvErrors: {...s.csvErrors, csv2: err}}));
            }}/>
            <CsvCard type="Room Numbers CSV" icon={<Building size={24} className="text-teal-500"/>} req="room_no" file={wizState.csv3} error={wizState.csvErrors.csv3} onFileChange={async (f)=>{
              const err = await validateCSV(f, 'rooms');
              setWizState(s => ({...s, csv3: f, csvErrors: {...s.csvErrors, csv3: err}}));
            }}/>
          </div>

          <div className="flex justify-between border-t border-gray-100 pt-6">
            <button onClick={()=>setStep(1)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Back</button>
            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv2 && wizState.csv3 && !wizState.csvErrors.csv1 && !wizState.csvErrors.csv2 && !wizState.csvErrors.csv3) {
                  try {
                    const sText = await wizState.csv1.text();
                    const sLines = sText.split('\n').filter(l => l.trim() !== '');
                    const sHeaders = sLines[0].toLowerCase().split(',').map(h=>h.trim());
                    
                    const studentsCount = Math.max(0, sLines.length - 1);
                    const subjIdx = sHeaders.findIndex(h => h === 'subject_code');
                    const subjectCounts = {};
                    for(let i=1; i<sLines.length; i++) {
                      const cols = sLines[i].split(',');
                      if (cols[subjIdx]) {
                        const code = cols[subjIdx].trim();
                        subjectCounts[code] = (subjectCounts[code] || 0) + 1;
                      }
                    }
                    
                    const rText = await wizState.csv3.text();
                    const rLines = rText.split('\n').filter(l => l.trim() !== '');
                    const rHeaders = rLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const roomIdx = rHeaders.findIndex(h => h.includes('room'));
                    const roomsData = [];
                    for(let i=1; i<rLines.length; i++) {
                      const cols = rLines[i].split(',');
                      if (cols[roomIdx]) roomsData.push(cols[roomIdx].trim());
                    }
                    
                    setWizState(s => ({...s, studentsCount, subjectCounts, roomsData, roomLayouts: {}}));
                    setStep(3);
                  } catch (err) {
                    alert("Error parsing CSV files. Please check the formats.");
                  }
                }
              }} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3 || wizState.csvErrors.csv1 || wizState.csvErrors.csv2 || wizState.csvErrors.csv3}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-40 transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <RoomLayoutsStep 
          wizState={wizState} 
          setWizState={setWizState} 
          onBack={()=>setStep(2)} 
          onProceed={()=>setStep(4)}
          state={state}
        />
      )}

      {step === 4 && (
        <ConfirmStep 
          wizState={wizState} 
          onBack={()=>setStep(3)} 
          state={state}
          onRun={async ()=>{
            setStep(5);
            setWizState(s => ({...s, processing: true}));
            
            try {
              // 1. Create Session
              const formData = new FormData();
              formData.append('exam_date', wizState.date);
              formData.append('time_from', wizState.startTime);
              formData.append('time_to', wizState.endTime);
              formData.append('students', wizState.csv1);
              formData.append('teachers', wizState.csv2);
              formData.append('rooms', wizState.csv3);
              
              const selectedSeats = {};
              for(const room of Object.keys(wizState.roomLayouts)) {
                selectedSeats[room] = wizState.roomLayouts[room].seats.filter(s=>s.avail).map(s=>s.id);
              }
              formData.append('selected_seats', JSON.stringify(selectedSeats));
              formData.append('rules', JSON.stringify(state.rules));

              const createRes = await fetch('http://localhost:3000/api/sessions', {
                method: 'POST',
                body: formData
              });
              
              if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.error || "Failed to create session");
              }
              
              const sessionData = await createRes.json();
              
              // 2. Run Allocation
              const allocRes = await fetch(`http://localhost:3000/api/sessions/${sessionData.session_id}/allocate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: sessionData.students, teachers: sessionData.teachers })
              });
              
              if (!allocRes.ok) {
                const err = await allocRes.json();
                throw new Error(err.error || "Failed to allocate");
              }
              
              setWizState(s => ({...s, processing: false, sessionId: sessionData.session_id, studentsCount: sessionData.total_students}));
              
            } catch (err) {
              alert(err.message);
              setStep(4);
              setWizState(s => ({...s, processing: false}));
            }
          }} 
        />
      )}

      {step === 5 && (
        <ResultStep 
          wizState={wizState} 
          onPublish={handlePublish} 
          onRerun={()=>{
            setStep(1);
            setWizState({ date: '', startTime: '', endTime: '', csv1: false, csv2: false, csv3: false, roomsData: ['B210', 'B211', 'B213', 'B218'], roomLayouts: {}, studentsCount: 120, processing: false });
          }} 
        />
      )}

    </div>
  );
}

function CsvCard({ type, icon, req, file, error, onFileChange }) {
  return (
    <label 
      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all ${
        error ? 'border-red-500 bg-red-50' : (file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50')
      }`}
    >
      <input type="file" accept=".csv" className="hidden" onChange={e => {
        if(e.target.files.length > 0) onFileChange(e.target.files[0]);
      }} />
      <div className="mb-3">
        {error ? <AlertCircle size={32} className="text-red-500"/> : (file ? <CheckCircle2 size={32} className="text-green-500"/> : icon)}
      </div>
      <h4 className={`font-bold mb-1 ${error ? 'text-red-800' : (file ? 'text-green-800' : 'text-gray-800')}`}>{type}</h4>
      <p className={`text-sm mb-3 ${error ? 'text-red-600' : (file ? 'text-green-600' : 'text-blue-600 font-medium')}`}>
        {error ? 'Invalid file format' : (file ? file.name : 'Click to upload')}
      </p>
      {error ? (
        <p className="text-xs text-red-600 font-bold leading-tight mt-1">{error}</p>
      ) : (
        <p className="text-xs text-gray-500 leading-tight mt-1">Required: {req}</p>
      )}
    </label>
  );
}

function RoomLayoutsStep({ wizState, setWizState, onBack, onProceed, state }) {
  const [expandedRoom, setExpandedRoom] = useState(null);

  const rooms = Object.keys(wizState.roomLayouts);
  const confirmedCount = rooms.filter(r => wizState.roomLayouts[r].confirmed).length;
  
  const { maxCapacity, benchesNeeded, totalBenches } = (() => {
    const tb = rooms.reduce((acc, r) => acc + wizState.roomLayouts[r].seats.filter(s=>s.avail).length, 0);
    const unique = Object.keys(wizState.subjectCounts || {}).length;
    const maxPB = unique <= 1 ? 1 : (state.rules?.maxPerBench || 2);
    let mc = 0, bn = 0;
    if (maxPB === 1) {
      mc = tb; bn = wizState.studentsCount;
    } else {
      const gs = Object.values(wizState.subjectCounts || {}).sort((a,b)=>b-a);
      if (gs.length > 0) {
        const lg = gs[0];
        const ot = wizState.studentsCount - lg;
        if (lg <= ot) { mc = tb * 2; bn = Math.ceil(wizState.studentsCount / 2); }
        else { mc = ot * 2 + (lg - ot); bn = ot + (lg - ot); }
      }
    }
    return { maxCapacity: mc, benchesNeeded: bn, totalBenches: tb };
  })();


  const toggleSeat = (roomNo, seatId) => {
    setWizState(s => {
      return {
        ...s,
        roomLayouts: {
          ...s.roomLayouts,
          [roomNo]: {
            ...s.roomLayouts[roomNo],
            confirmed: false,
            seats: s.roomLayouts[roomNo].seats.map(seat => seat.id === seatId ? {...seat, avail: !seat.avail} : seat)
          }
        }
      };
    });
  };

  const setAllSeats = (roomNo, avail) => {
    setWizState(s => {
      return {
        ...s,
        roomLayouts: {
          ...s.roomLayouts,
          [roomNo]: {
            ...s.roomLayouts[roomNo],
            confirmed: false,
            seats: s.roomLayouts[roomNo].seats.map(seat => ({...seat, avail}))
          }
        }
      };
    });
  };

  if (expandedRoom) {
    const rData = wizState.roomLayouts[expandedRoom];
    const availCount = rData.seats.filter(s=>s.avail).length;
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Room {expandedRoom} 
              {rData.isVerified && <Badge color="blue">Pre-verified</Badge>}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Click seats to toggle availability</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{availCount} <span className="text-lg text-gray-400">/ 40</span></p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Available Seats</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Available</div>
            <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Defective/Blocked</div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setAllSeats(expandedRoom, true)} className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50">Select All</button>
            <button onClick={()=>setAllSeats(expandedRoom, false)} className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50">Deselect All</button>
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <div className="min-w-max">
            {/* Grid Header A B C D E */}
            <div className="flex ml-8 mb-2">
              {['A','B','C','D','E'].map(col => <div key={col} className="w-12 mx-1 text-center font-bold text-gray-500">{col}</div>)}
            </div>
            {/* Rows 1-8 */}
            {[1,2,3,4,5,6,7,8].map(rowNum => (
              <div key={rowNum} className="flex items-center mb-2">
                <div className="w-8 font-bold text-gray-500 text-right pr-3">{rowNum}</div>
                {['A','B','C','D','E'].map(col => {
                  const seatId = `${col}${rowNum}`;
                  const seat = rData.seats.find(s => s.id === seatId);
                  return (
                    <button 
                      key={seatId}
                      onClick={() => toggleSeat(expandedRoom, seatId)}
                      className={`w-12 h-12 mx-1 rounded-md flex items-center justify-center font-bold text-sm transition-transform active:scale-95 ${seat.avail ? 'bg-green-500 text-white shadow-sm hover:bg-green-600' : 'bg-red-500 text-white shadow-sm hover:bg-red-600'}`}
                    >
                      {seatId}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button onClick={()=>setExpandedRoom(null)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Back to Allocator</button>
          <button 
            onClick={() => {
              setWizState(s => ({...s, roomLayouts: {...s.roomLayouts, [expandedRoom]: {...s.roomLayouts[expandedRoom], confirmed: true}}}));
              setExpandedRoom(null);
            }} 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Confirm Layout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Room Seat Layouts</h3>
          <p className="text-sm text-gray-500 mt-1">View and configure each room's seat layout. Confirm each room before proceeding.</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Capacity</p>
            <p className={`text-lg font-bold ${maxCapacity >= wizState.studentsCount ? 'text-green-600' : 'text-red-600'}`}>{maxCapacity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Students</p>
            <p className="text-lg font-bold text-gray-800">{wizState.studentsCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Confirmed</p>
            <p className="text-lg font-bold text-blue-600">{confirmedCount} / {rooms.length}</p>
          </div>
        </div>
      </div>

      {maxCapacity < wizState.studentsCount && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5"/>
          <p className="text-sm font-semibold">Insufficient capacity! You have {maxCapacity} capacity but {wizState.studentsCount} students. Need {benchesNeeded} benches but only {totalBenches} are selected.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {rooms.map(room => {
          const rData = wizState.roomLayouts[room];
          const availCount = rData.seats.filter(s=>s.avail).length;
          return (
            <div 
              key={room} 
              onClick={() => setExpandedRoom(room)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${rData.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${rData.confirmed ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                  <Building size={24}/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">{room}</h4>
                    {rData.isVerified && <Badge color="blue">Pre-verified</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 font-medium mt-1"><span className={rData.confirmed ? 'text-green-700 font-bold' : 'text-gray-900 font-bold'}>{availCount}</span> / 40 seats available</p>
                </div>
              </div>
              <div className="text-gray-400 flex flex-col items-center gap-1">
                {rData.confirmed ? <CheckCircle2 size={24} className="text-green-500"/> : <Eye size={20} />}
                {!rData.confirmed && <span className="text-[10px] font-bold uppercase tracking-wide">Review</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between border-t border-gray-100 pt-6">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Back</button>
        <button 
          onClick={onProceed} 
          disabled={confirmedCount !== rooms.length || maxCapacity < wizState.studentsCount}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-40 transition-colors"
        >
          Proceed to Confirm &rarr;
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({ wizState, onBack, onRun, state }) {
  const rooms = Object.keys(wizState.roomLayouts);
  const { maxCapacity, surplus, totalBenches, benchesNeeded } = (() => {
    const tb = rooms.reduce((acc, r) => acc + wizState.roomLayouts[r].seats.filter(s=>s.avail).length, 0);
    const unique = Object.keys(wizState.subjectCounts || {}).length;
    const maxPB = unique <= 1 ? 1 : (state.rules?.maxPerBench || 2);
    let mc = 0, bn = 0;
    if (maxPB === 1) {
      mc = tb; bn = wizState.studentsCount;
    } else {
      const gs = Object.values(wizState.subjectCounts || {}).sort((a,b)=>b-a);
      if (gs.length > 0) {
        const lg = gs[0];
        const ot = wizState.studentsCount - lg;
        if (lg <= ot) { mc = tb * 2; bn = Math.ceil(wizState.studentsCount / 2); }
        else { mc = ot * 2 + (lg - ot); bn = ot + (lg - ot); }
      }
    }
    return { maxCapacity: mc, surplus: mc - wizState.studentsCount, totalBenches: tb, benchesNeeded: bn };
  })();


  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={24}/></div>
        <h3 className="text-2xl font-bold text-gray-900">Confirm Allocation</h3>
        <p className="text-sm text-gray-500 mt-1">Review all details before running the allocation engine.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Exam Date</p>
          <p className="font-bold text-gray-900 mt-1">{wizState.date}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Timing</p>
          <p className="font-bold text-gray-900 mt-1">{wizState.startTime} - {wizState.endTime}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Rooms</p>
          <p className="font-bold text-gray-900 mt-1">{rooms.length}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Students</p>
          <p className="font-bold text-gray-900 mt-1">{wizState.studentsCount}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Capacity</p>
          <p className="font-bold text-gray-900 mt-1">{maxCapacity}</p>
        </div>
        <div className={`p-4 rounded-lg border text-center ${surplus > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-semibold uppercase ${surplus > 0 ? 'text-green-700' : 'text-red-700'}`}>Surplus Seats</p>
          <p className={`font-bold mt-1 ${surplus > 0 ? 'text-green-700' : 'text-red-700'}`}>{surplus > 0 ? `+${surplus}` : surplus}</p>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">ROOM BREAKDOWN</h4>
        <div className="space-y-2">
          {rooms.map(r => (
            <div key={r} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">{r}</span>
                {wizState.roomLayouts[r].isVerified && <Badge color="green">Verified</Badge>}
              </div>
              <span className="text-sm font-medium text-gray-600">{wizState.roomLayouts[r].seats.filter(s=>s.avail).length} seats</span>
            </div>
          ))}
        </div>
      </div>

      {surplus < 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5"/>
          <p className="text-sm">Not enough dynamic capacity for all students! Required benches: {benchesNeeded}, but only {totalBenches} selected.</p>
        </div>
      )}

      <div className="flex justify-between border-t border-gray-100 pt-6">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Back</button>
        <button 
          onClick={onRun} 
          disabled={surplus < 0}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Play size={16} fill="currentColor"/> Run Allocation Engine
        </button>
      </div>
    </div>
  );
}

function ResultStep({ wizState, onPublish, onRerun }) {
  if (wizState.processing) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center max-w-lg mx-auto">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Allocation in Progress...</h3>
        <p className="text-gray-500 mb-8">Assigning {wizState.studentsCount} students to {wizState.roomsData.length} rooms.</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
          <div className="bg-blue-600 h-2.5 rounded-full animate-[progress_2.5s_ease-in-out_forwards]" style={{width: '0%'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-2">Allocation Complete!</h3>
      <p className="text-gray-500 mb-8 text-lg">All students have been successfully allocated.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-3xl font-bold text-gray-800">{wizState.studentsCount}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Students Allocated</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-3xl font-bold text-gray-800">{wizState.roomsData.length}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Rooms Used</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-3xl font-bold text-gray-800">2.4s</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Processing Time</p>
        </div>
      </div>

      <div className="text-left mb-8 space-y-3">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 px-2">Download Reports</h4>
        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download/room-range`} className="block w-full flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-3 text-blue-700 font-medium"><Building size={20}/> Download Room Range CSV</div>
          <Download size={20} className="text-blue-500"/>
        </a>
        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download/staff`} className="block w-full flex items-center justify-between p-4 border border-purple-100 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
          <div className="flex items-center gap-3 text-purple-700 font-medium"><User size={20}/> Download Staff CSV</div>
          <Download size={20} className="text-purple-500"/>
        </a>
        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download/seat-map`} className="block w-full flex items-center justify-between p-4 border border-teal-100 bg-teal-50/50 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors">
          <div className="flex items-center gap-3 text-teal-700 font-medium"><Users size={20}/> Download Student Seating CSV</div>
          <Download size={20} className="text-teal-500"/>
        </a>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onRerun} className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors">Rerun Allocation</button>
        <button onClick={onPublish} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 transition-colors shadow-md shadow-green-200">
          Publish Allocation <Check size={20}/>
        </button>
      </div>
    </div>
  );
}

function HistoryPage({ state }) {
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/sessions?status=published')
      .then(res => res.json())
      .then(data => setAllocations(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">History</h2>
          <p className="text-sm text-gray-500 mt-1">Published allocations from the past {state.rules.historyDays} days</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 w-16">#</th>
              <th className="px-6 py-4">Exam Date</th>
              <th className="px-6 py-4">Timing</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4">Rooms</th>
              <th className="px-6 py-4">Published At</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allocations.map((alloc, idx) => (
              <tr key={alloc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{alloc.exam_date.split('T')[0]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{alloc.time_from} – {alloc.time_to}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.total_students}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.total_rooms}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{new Date(alloc.published_at).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                  <button onClick={() => setSelectedAlloc(alloc)} className="hover:underline">View Details &rarr;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAlloc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
            <button onClick={() => setSelectedAlloc(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={24}/></button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Allocation Details</h3>
            <p className="text-gray-500 mb-8">{selectedAlloc.exam_date.split('T')[0]} &middot; {selectedAlloc.time_from} – {selectedAlloc.time_to}</p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Users size={20} className="text-blue-500 mb-2"/>
                <p className="text-xl font-bold text-gray-900">{selectedAlloc.total_students}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Students</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Building size={20} className="text-purple-500 mb-2"/>
                <p className="text-xl font-bold text-gray-900">{selectedAlloc.total_rooms}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Rooms</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Clock size={20} className="text-teal-500 mb-2"/>
                <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{new Date(selectedAlloc.published_at).toLocaleTimeString()}</p>
                <p className="text-[10px] text-gray-500 uppercase mt-1">Time</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Check size={20} className="text-green-500 mb-2"/>
                <p className="text-sm font-bold text-gray-900 mt-1">Published</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Status</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Download Reports</h4>
              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download/room-range`} className="block w-full flex items-center justify-between p-4 border border-blue-200 text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><FileText size={20}/> Download Room Range CSV</span>
                <Download size={20}/>
              </a>
              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download/staff`} className="block w-full flex items-center justify-between p-4 border border-purple-200 text-purple-700 bg-white rounded-xl hover:bg-purple-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><User size={20}/> Download Staff CSV</span>
                <Download size={20}/>
              </a>
              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download/seat-map`} className="block w-full flex items-center justify-between p-4 border border-teal-200 text-teal-700 bg-white rounded-xl hover:bg-teal-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><Users size={20}/> Download Student Seating CSV</span>
                <Download size={20}/>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RulesConfigurator({ state, dispatch }) {
  const [form, setForm] = useState(state.rules);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_RULES', payload: form });
    dispatch({ type: 'SHOW_TOAST', payload: { message: "Rules saved successfully", type: "success" } });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Rules Configurator</h2>
        <p className="text-sm text-gray-500 mt-1">Configure system-wide allocation parameters and constraints.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Max Students per Bench</h4>
            <p className="text-sm text-gray-500 mt-1">Number of students allowed per bench/seat</p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer ${form.maxPerBench === 1 ? 'bg-white shadow-sm border-gray-200 text-blue-700 font-semibold' : 'text-gray-600'}`}>
              <input type="radio" name="bench" checked={form.maxPerBench === 1} onChange={() => setForm({...form, maxPerBench: 1})} className="hidden" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.maxPerBench===1?'border-blue-600':'border-gray-400'}`}>
                {form.maxPerBench===1 && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
              </div>
              1 student
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer ${form.maxPerBench === 2 ? 'bg-white shadow-sm border-gray-200 text-blue-700 font-semibold' : 'text-gray-600'}`}>
              <input type="radio" name="bench" checked={form.maxPerBench === 2} onChange={() => setForm({...form, maxPerBench: 2})} className="hidden" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.maxPerBench===2?'border-blue-600':'border-gray-400'}`}>
                {form.maxPerBench===2 && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
              </div>
              2 students
            </label>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Department Mixing</h4>
            <p className="text-sm text-gray-500 mt-1">Allow students from different departments in the same room</p>
          </div>
          <button 
            onClick={() => setForm({...form, deptMixing: !form.deptMixing})}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${form.deptMixing ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute transition-transform ${form.deptMixing ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Max Students per Hall</h4>
            <p className="text-sm text-gray-500 mt-1">Maximum capacity limit per examination hall</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={form.maxPerHall} onChange={e=>setForm({...form, maxPerHall: parseInt(e.target.value)||0})} className="w-20 border border-gray-300 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
            <span className="text-gray-500 text-sm">students</span>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Visibility Offset</h4>
            <p className="text-sm text-gray-500 mt-1">Minutes before exam when allocation becomes visible to students/teachers</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={form.visibilityOffset} onChange={e=>setForm({...form, visibilityOffset: parseInt(e.target.value)||0})} className="w-20 border border-gray-300 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
            <span className="text-gray-500 text-sm">minutes</span>
          </div>
        </div>

        <div className="p-6 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">History Retention</h4>
            <p className="text-sm text-gray-500 mt-1">Number of days to retain allocation history</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={form.historyDays} onChange={e=>setForm({...form, historyDays: parseInt(e.target.value)||0})} className="w-20 border border-gray-300 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
            <span className="text-gray-500 text-sm">days</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 transition-colors">
          <Save size={20} /> Save Rules
        </button>
      </div>
    </div>
  );
}

function TeacherAlteration({ dispatch }) {
  const [filter, setFilter] = useState('All');
  const [approveModal, setApproveModal] = useState(null);
  const [replacementId, setReplacementId] = useState('');
  const [alterations, setAlterations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlterations = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/alterations');
      const data = await res.json();
      setAlterations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlterations();
  }, []);

  const filteredData = filter === 'All' ? alterations : alterations.filter(r => r.status.toLowerCase() === filter.toLowerCase());
  
  const counts = {
    All: alterations.length,
    Pending: alterations.filter(r=>r.status==='pending').length,
    Approved: alterations.filter(r=>r.status==='approved').length,
    Rejected: alterations.filter(r=>r.status==='rejected').length,
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/alterations/${approveModal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_teacher_id: replacementId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve');
      
      dispatch({ type: 'SHOW_TOAST', payload: { message: "Alteration approved", type: "success" } });
      setApproveModal(null);
      setReplacementId('');
      fetchAlterations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/alterations/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject');

      dispatch({ type: 'SHOW_TOAST', payload: { message: "Alteration rejected", type: "success" } });
      fetchAlterations();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Teacher Alteration</h2>
        <p className="text-sm text-gray-500 mt-1">Review and manage teacher substitution requests.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f} <span className={`ml-1 text-xs opacity-80`}>({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Teacher</th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 max-w-[200px]">Reason</th>
              <th className="px-6 py-4">Suggested Alt.</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map(row => {
              const dateStr = row.exam_date ? row.exam_date.split('T')[0] : '';
              return (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.teacher_name}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{row.requesting_teacher_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.room_no}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dateStr}</td>
                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]">{row.reason}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{row.suggested_alt_id || 'none'}</td>
                <td className="px-6 py-4">
                  <Badge color={row.status === 'approved' ? 'green' : row.status === 'pending' ? 'amber' : 'red'}>{row.status.toUpperCase()}</Badge>
                </td>
                <td className="px-6 py-4 text-sm">
                  {row.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => { setApproveModal(row); setReplacementId(row.suggested_alt_id || ''); }} className="px-3 py-1 border border-green-500 text-green-600 rounded text-xs font-bold hover:bg-green-50 transition-colors">Approve</button>
                      <button onClick={() => handleReject(row.id)} className="px-3 py-1 border border-red-500 text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-colors">Reject</button>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
              </tr>
            )})}
            {filteredData.length === 0 && (
              <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 text-sm">No requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Approve Alteration Request</h3>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Teacher</span><span className="font-bold text-gray-900">{approveModal.teacher_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Teacher ID</span><span className="font-mono text-gray-700">{approveModal.requesting_teacher_id}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Room</span><span className="font-bold text-gray-900">{approveModal.room_no}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Exam Date</span><span className="text-gray-900">{approveModal.exam_date ? approveModal.exam_date.split('T')[0] : ''}</span></div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wider">Replacement Teacher ID</label>
                <input 
                  type="text" 
                  value={replacementId} 
                  onChange={e=>setReplacementId(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
                {approveModal.suggested_alt_id && (
                  <p className="text-xs text-gray-500 mt-2">Suggested by teacher: <span className="font-mono text-gray-800">{approveModal.suggested_alt_id}</span></p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setApproveModal(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleApprove} className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md shadow-green-200">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function About() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Info size={40}/>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hall Mate</h2>
        <h3 className="text-xl text-gray-500 mb-6 font-medium">Exam Hall Allocation System</h3>
        <p className="text-gray-600 leading-relaxed mb-8">
          A comprehensive administrative dashboard designed to streamline the process of examination hall allocation, staff assignments, and substitution management. Developed to ensure seamless examinations operations.
        </p>
        <div className="inline-flex gap-8 border-t border-gray-100 pt-8">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Role</p>
            <p className="font-medium text-gray-900">Admin</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Account</p>
            <p className="font-medium text-gray-900">Admin User</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- MAIN APP ---

export default function App() {
  const [state, dispatch] = useReducer(appReducer, {
    allocations: initialAllocations,
    hallAssignments: initialHallAssignments,
    alterationRequests: initialAlterations,
    rules: initialRules,
    currentPage: 'Dashboard',
    toast: null
  });

  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  const navItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'Hall Assignment', icon: <MapPin size={20} />, label: 'Hall Assignment' },
    { id: 'Allocator', icon: <GitBranch size={20} />, label: 'Allocator' },
    { id: 'History', icon: <History size={20} />, label: 'History' },
    { id: 'Rules Configurator', icon: <Settings size={20} />, label: 'Rules Configurator' },
    { id: 'Teacher Alteration', icon: <Users size={20} />, label: 'Teacher Alteration' },
    { id: 'About', icon: <Info size={20} />, label: 'About' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-[210px] shrink-0 bg-[#1e2432] text-gray-300 flex flex-col h-full z-20">
        <div className="p-6 pb-8 border-b border-gray-700/50">
          <h1 className="text-lg font-bold text-white leading-tight">Hall Mate</h1>
          <p className="text-[10px] text-blue-400 font-semibold tracking-widest mt-1">EXAM HALL ALLOCATION</p>
        </div>
        
        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
          {navItems.map(item => {
            const isActive = state.currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'NAVIGATE', payload: item.id })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/50' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-blue-200' : 'text-gray-400'}`}>{item.icon}</div>
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-6 border-t border-gray-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
            A
          </div>
          <div className="overflow-hidden">
            <p className="text-sm text-white font-medium truncate">Admin User</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Super Administrator</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{state.currentPage}</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search systems..." className="pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none w-64 transition-all" />
            </div>
            <button className="text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </button>
            <button className="text-gray-400 hover:text-gray-600"><HelpCircle size={20} /></button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {/* TOAST NOTIFICATION */}
          {state.toast && (
            <div className={`absolute top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all border ${state.toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              <CheckCircle2 size={20} className={state.toast.type === 'success' ? 'text-green-500' : 'text-blue-500'} />
              <p className="font-semibold text-sm">{state.toast.message}</p>
            </div>
          )}

          {state.currentPage === 'Dashboard' && <Dashboard state={state} />}
          {state.currentPage === 'Hall Assignment' && <HallAssignment state={state} dispatch={dispatch} />}
          {state.currentPage === 'Allocator' && <AllocatorWizard state={state} dispatch={dispatch} />}
          {state.currentPage === 'History' && <HistoryPage state={state} />}
          {state.currentPage === 'Rules Configurator' && <RulesConfigurator state={state} dispatch={dispatch} />}
          {state.currentPage === 'Teacher Alteration' && <TeacherAlteration state={state} dispatch={dispatch} />}
          {state.currentPage === 'About' && <About />}

        </main>
      </div>
    </div>
  );
}
