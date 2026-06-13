import re
import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\frontend\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update initial state and rules (if needed, but it's okay)

# 2. Update CsvCard to accept file input
csv_card_old = """function CsvCard({ type, icon, req, uploaded, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all ${
        uploaded ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <div className="mb-3">
        {uploaded ? <CheckCircle2 size={32} className="text-green-500"/> : icon}
      </div>
      <h4 className={`font-bold mb-1 ${uploaded ? 'text-green-800' : 'text-gray-800'}`}>{type}</h4>
      <p className={`text-sm mb-3 ${uploaded ? 'text-green-600' : 'text-blue-600 font-medium'}`}>
        {uploaded ? `${type.replace(' ', '_').toLowerCase()}.csv` : 'Click to upload'}
      </p>
      <p className="text-xs text-gray-500 leading-tight">Required: {req}</p>
    </div>
  );
}"""

csv_card_new = """function CsvCard({ type, icon, req, file, onFileChange }) {
  return (
    <label 
      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all ${
        file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <input type="file" accept=".csv" className="hidden" onChange={e => onFileChange(e.target.files[0])} />
      <div className="mb-3">
        {file ? <CheckCircle2 size={32} className="text-green-500"/> : icon}
      </div>
      <h4 className={`font-bold mb-1 ${file ? 'text-green-800' : 'text-gray-800'}`}>{type}</h4>
      <p className={`text-sm mb-3 ${file ? 'text-green-600' : 'text-blue-600 font-medium'}`}>
        {file ? file.name : 'Click to upload'}
      </p>
      <p className="text-xs text-gray-500 leading-tight">Required: {req}</p>
    </label>
  );
}"""
content = content.replace(csv_card_old, csv_card_new)

# 3. Update AllocatorWizard State and Check Slot
wizard_state_old = """  const [wizState, setWizState] = useState({
    date: '', startTime: '', endTime: '',
    csv1: false, csv2: false, csv3: false,
    roomsData: ['B210', 'B211', 'B213', 'B218'],
    roomLayouts: {}, // { roomNo: { confirmed: boolean, seats: [{id: 'A1', avail: true}] } }
    studentsCount: 120,
    processing: false
  });
  const [duplicateError, setDuplicateError] = useState(false);"""

wizard_state_new = """  const [wizState, setWizState] = useState({
    date: '', startTime: '', endTime: '',
    csv1: null, csv2: null, csv3: null,
    roomsData: [],
    roomLayouts: {}, // { roomNo: { confirmed: boolean, seats: [{id: 'A1', avail: true}] } }
    studentsCount: 0,
    processing: false,
    sessionId: null
  });
  const [duplicateError, setDuplicateError] = useState(false);"""
content = content.replace(wizard_state_old, wizard_state_new)

step1_old = """  const handleStep1Proceed = () => {
    const dup = state.allocations.some(a => a.date === wizState.date && a.startTime === wizState.startTime && a.endTime === wizState.endTime);
    if (dup) {
      setDuplicateError(true);
    } else {
      setDuplicateError(false);
      setStep(2);
    }
  };"""

step1_new = """  const handleStep1Proceed = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/sessions/check-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_date: wizState.date, time_from: wizState.startTime, time_to: wizState.endTime })
      });
      if (!res.ok) {
        setDuplicateError(true);
      } else {
        setDuplicateError(false);
        setStep(2);
      }
    } catch (err) {
      alert("Error connecting to backend");
    }
  };"""
content = content.replace(step1_old, step1_new)

# 4. Step 2 upload parsing
step2_jsx_old = """          <div className="grid grid-cols-3 gap-6 mb-8">
            <CsvCard type="Students CSV" icon={<FileText size={24} className="text-blue-500"/>} req="name, rollno, dept, year, degree, subject_code" uploaded={wizState.csv1} onClick={()=>setWizState({...wizState, csv1: true})}/>
            <CsvCard type="Teachers CSV" icon={<User size={24} className="text-orange-500"/>} req="name, id, room_no" uploaded={wizState.csv2} onClick={()=>setWizState({...wizState, csv2: true})}/>
            <CsvCard type="Room Numbers CSV" icon={<Building size={24} className="text-teal-500"/>} req="room_no" uploaded={wizState.csv3} onClick={()=>setWizState({...wizState, csv3: true})}/>
          </div>"""

step2_jsx_new = """          <div className="grid grid-cols-3 gap-6 mb-8">
            <CsvCard type="Students CSV" icon={<FileText size={24} className="text-blue-500"/>} req="name, rollno, dept, year, degree, subject_code" file={wizState.csv1} onFileChange={f=>setWizState({...wizState, csv1: f})}/>
            <CsvCard type="Teachers CSV" icon={<User size={24} className="text-orange-500"/>} req="name, id" file={wizState.csv2} onFileChange={f=>setWizState({...wizState, csv2: f})}/>
            <CsvCard type="Room Numbers CSV" icon={<Building size={24} className="text-teal-500"/>} req="room_no" file={wizState.csv3} onFileChange={f=>setWizState({...wizState, csv3: f})}/>
          </div>"""
content = content.replace(step2_jsx_old, step2_jsx_new)

# Step 2 Next button logic to parse CSV
step2_next_old = """            <button 
              onClick={()=>setStep(3)} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-40 transition-colors"
            >
              Next &rarr;
            </button>"""

step2_next_new = """            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv3) {
                  // Count students approx
                  const sText = await wizState.csv1.text();
                  const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                  const studentsCount = Math.max(0, sLines.length - 1);
                  
                  // Parse rooms
                  const rText = await wizState.csv3.text();
                  const rLines = rText.split('\\n').filter(l => l.trim() !== '');
                  const headers = rLines[0].split(',');
                  const roomIdx = headers.findIndex(h => h.trim().toLowerCase().includes('room'));
                  const roomsData = [];
                  for(let i=1; i<rLines.length; i++) {
                    const cols = rLines[i].split(',');
                    if (cols[roomIdx]) roomsData.push(cols[roomIdx].trim());
                  }
                  
                  setWizState(s => ({...s, studentsCount, roomsData, roomLayouts: {}}));
                  setStep(3);
                }
              }} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-40 transition-colors"
            >
              Next &rarr;
            </button>"""
content = content.replace(step2_next_old, step2_next_new)


# Step 4 Run Engine Logic
step4_run_old = """      {step === 4 && (
        <ConfirmStep 
          wizState={wizState} 
          onBack={()=>setStep(3)} 
          onRun={()=>{
            setStep(5);
            setWizState(s => ({...s, processing: true}));
            setTimeout(() => {
              setWizState(s => ({...s, processing: false}));
            }, 2500);
          }} 
        />
      )}"""

step4_run_new = """      {step === 4 && (
        <ConfirmStep 
          wizState={wizState} 
          onBack={()=>setStep(3)} 
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
      )}"""
content = content.replace(step4_run_old, step4_run_new)

# Result Step Publish Handler
publish_old = """  const handlePublish = () => {
    const totalSelectedSeats = Object.values(wizState.roomLayouts).reduce((acc, r) => acc + r.seats.filter(s=>s.avail).length, 0);
    const newAlloc = {
      id: Date.now(),
      date: wizState.date,
      startTime: wizState.startTime,
      endTime: wizState.endTime,
      students: wizState.studentsCount,
      rooms: wizState.roomsData.length,
      publishedAt: new Date().toISOString().slice(0,16).replace('T',' ')
    };
    dispatch({ type: 'ADD_ALLOCATION', payload: newAlloc });
    dispatch({ type: 'SHOW_TOAST', payload: { message: "Allocation published successfully.", type: "success" } });
    dispatch({ type: 'NAVIGATE', payload: 'History' });
  };"""

publish_new = """  const handlePublish = async () => {
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
  };"""
content = content.replace(publish_old, publish_new)


# History Data fetching
history_old = """function HistoryPage({ state }) {
  const [selectedAlloc, setSelectedAlloc] = useState(null);

  return ("""

history_new = """function HistoryPage({ state }) {
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/sessions?status=published')
      .then(res => res.json())
      .then(data => setAllocations(data))
      .catch(err => console.error(err));
  }, []);

  return ("""
content = content.replace(history_old, history_new)

# History mapping
hist_map_old = """            {state.allocations.map((alloc, idx) => ("""
hist_map_new = """            {allocations.map((alloc, idx) => ("""
content = content.replace(hist_map_old, hist_map_new)

hist_map_body_old = """                <td className="px-6 py-4 text-sm font-bold text-gray-900">{alloc.date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{alloc.startTime} – {alloc.endTime}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.students}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.rooms}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{alloc.publishedAt.split(' ')[0]}</div>
                  <div className="text-xs">{alloc.publishedAt.split(' ')[1]}</div>
                </td>"""

hist_map_body_new = """                <td className="px-6 py-4 text-sm font-bold text-gray-900">{alloc.exam_date.split('T')[0]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{alloc.time_from} – {alloc.time_to}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.total_students}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{alloc.total_rooms}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{new Date(alloc.published_at).toLocaleString()}</div>
                </td>"""
content = content.replace(hist_map_body_old, hist_map_body_new)

# History Detail mappings
hist_det_old = """            <p className="text-gray-500 mb-8">{selectedAlloc.date} &middot; {selectedAlloc.startTime} – {selectedAlloc.endTime}</p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Users size={20} className="text-blue-500 mb-2"/>
                <p className="text-xl font-bold text-gray-900">{selectedAlloc.students}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Students</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Building size={20} className="text-purple-500 mb-2"/>
                <p className="text-xl font-bold text-gray-900">{selectedAlloc.rooms}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">Rooms</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 flex flex-col items-center justify-center">
                <Clock size={20} className="text-teal-500 mb-2"/>
                <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{selectedAlloc.publishedAt.split(' ')[1]}</p>"""

hist_det_new = """            <p className="text-gray-500 mb-8">{selectedAlloc.exam_date.split('T')[0]} &middot; {selectedAlloc.time_from} – {selectedAlloc.time_to}</p>

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
                <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{new Date(selectedAlloc.published_at).toLocaleTimeString()}</p>"""
content = content.replace(hist_det_old, hist_det_new)

# Download links for ResultStep
res_dl_old = """        <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-3 text-blue-700 font-medium"><Building size={20}/> Download Room Range CSV</div>
          <Download size={20} className="text-blue-500"/>
        </div>
        <div className="flex items-center justify-between p-4 border border-purple-100 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
          <div className="flex items-center gap-3 text-purple-700 font-medium"><User size={20}/> Download Staff CSV</div>
          <Download size={20} className="text-purple-500"/>
        </div>
        <div className="flex items-center justify-between p-4 border border-teal-100 bg-teal-50/50 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors">
          <div className="flex items-center gap-3 text-teal-700 font-medium"><Users size={20}/> Download Student Seating CSV</div>
          <Download size={20} className="text-teal-500"/>
        </div>"""

res_dl_new = """        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download-room-range`} className="block w-full flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-3 text-blue-700 font-medium"><Building size={20}/> Download Room Range CSV</div>
          <Download size={20} className="text-blue-500"/>
        </a>
        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download-staff`} className="block w-full flex items-center justify-between p-4 border border-purple-100 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
          <div className="flex items-center gap-3 text-purple-700 font-medium"><User size={20}/> Download Staff CSV</div>
          <Download size={20} className="text-purple-500"/>
        </a>
        <a href={`http://localhost:3000/api/sessions/${wizState.sessionId}/download-seat-map`} className="block w-full flex items-center justify-between p-4 border border-teal-100 bg-teal-50/50 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors">
          <div className="flex items-center gap-3 text-teal-700 font-medium"><Users size={20}/> Download Student Seating CSV</div>
          <Download size={20} className="text-teal-500"/>
        </a>"""
content = content.replace(res_dl_old, res_dl_new)

# Download links for History Detail
hist_dl_old = """              <button className="w-full flex items-center justify-between p-4 border border-blue-200 text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><FileText size={20}/> Download Room Range CSV</span>
                <Download size={20}/>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-purple-200 text-purple-700 bg-white rounded-xl hover:bg-purple-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><User size={20}/> Download Staff CSV</span>
                <Download size={20}/>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-teal-200 text-teal-700 bg-white rounded-xl hover:bg-teal-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><Users size={20}/> Download Student Seating CSV</span>
                <Download size={20}/>
              </button>"""

hist_dl_new = """              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download-room-range`} className="block w-full flex items-center justify-between p-4 border border-blue-200 text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><FileText size={20}/> Download Room Range CSV</span>
                <Download size={20}/>
              </a>
              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download-staff`} className="block w-full flex items-center justify-between p-4 border border-purple-200 text-purple-700 bg-white rounded-xl hover:bg-purple-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><User size={20}/> Download Staff CSV</span>
                <Download size={20}/>
              </a>
              <a href={`http://localhost:3000/api/sessions/${selectedAlloc.id}/download-seat-map`} className="block w-full flex items-center justify-between p-4 border border-teal-200 text-teal-700 bg-white rounded-xl hover:bg-teal-50 transition-colors font-medium">
                <span className="flex items-center gap-3"><Users size={20}/> Download Student Seating CSV</span>
                <Download size={20}/>
              </a>"""
content = content.replace(hist_dl_old, hist_dl_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done patching App.jsx")
