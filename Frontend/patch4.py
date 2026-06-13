import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\frontend\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update wizState to include csvErrors
state_init_old = """    csv1: null, csv2: null, csv3: null,
    roomsData: [],"""
state_init_new = """    csv1: null, csv2: null, csv3: null,
    csvErrors: { csv1: null, csv2: null, csv3: null },
    roomsData: [],"""
content = content.replace(state_init_old, state_init_new)

# 2. Add validation functions outside component
val_funcs = """// --- VALIDATION HELPER ---
const validateCSV = async (file, type) => {
  if (!file) return null;
  try {
    const text = await file.text();
    const lines = text.split('\\n').filter(l => l.trim() !== '');
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

// --- INITIAL DATA & STATE ---"""
content = content.replace("// --- INITIAL DATA & STATE ---", val_funcs)

# 3. Update Step 2 JSX to handle async validation and pass errors
step2_jsx_old = """          <div className="grid grid-cols-3 gap-6 mb-8">
            <CsvCard type="Students CSV" icon={<FileText size={24} className="text-blue-500"/>} req="name, rollno, dept, year, degree, subject_code" file={wizState.csv1} onFileChange={f=>setWizState({...wizState, csv1: f})}/>
            <CsvCard type="Teachers CSV" icon={<User size={24} className="text-orange-500"/>} req="name, id" file={wizState.csv2} onFileChange={f=>setWizState({...wizState, csv2: f})}/>
            <CsvCard type="Room Numbers CSV" icon={<Building size={24} className="text-teal-500"/>} req="room_no" file={wizState.csv3} onFileChange={f=>setWizState({...wizState, csv3: f})}/>
          </div>"""

step2_jsx_new = """          <div className="grid grid-cols-3 gap-6 mb-8">
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
          </div>"""
content = content.replace(step2_jsx_old, step2_jsx_new)

# 4. Revert Next button to avoid validation since it's already done
step2_next_old = """            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv2 && wizState.csv3) {
                  try {
                    // Check Students CSV headers
                    const sText = await wizState.csv1.text();
                    const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                    const sHeaders = sLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const reqS = ['name', 'roll_no', 'dept', 'year', 'degree', 'subject_code'];
                    // allow rollno or roll_no
                    const missingS = reqS.filter(req => {
                      if (req === 'roll_no') return !sHeaders.includes('roll_no') && !sHeaders.includes('rollno');
                      return !sHeaders.includes(req);
                    });
                    if (missingS.length > 0) return alert(`Students CSV missing columns: ${missingS.join(', ')}`);

                    // Check Teachers CSV headers
                    const tText = await wizState.csv2.text();
                    const tLines = tText.split('\\n').filter(l => l.trim() !== '');
                    const tHeaders = tLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const reqT = ['teacher_name', 'teacher_id'];
                    const missingT = reqT.filter(req => !tHeaders.includes(req) && !tHeaders.includes(req.replace('_','')));
                    if (missingT.length > 0) return alert(`Teachers CSV missing columns: ${missingT.join(', ')}`);

                    // Check Rooms CSV headers
                    const rText = await wizState.csv3.text();
                    const rLines = rText.split('\\n').filter(l => l.trim() !== '');
                    const rHeaders = rLines[0].toLowerCase().split(',').map(h=>h.trim());
                    const roomIdx = rHeaders.findIndex(h => h.includes('room'));
                    if (roomIdx === -1) return alert(`Rooms CSV missing 'room_no' column`);

                    // Process Data if valid
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
                    
                    const roomsData = [];
                    for(let i=1; i<rLines.length; i++) {
                      const cols = rLines[i].split(',');
                      if (cols[roomIdx]) roomsData.push(cols[roomIdx].trim());
                    }
                    
                    if (roomsData.length === 0) return alert("Rooms CSV contains no valid rooms!");
                    
                    setWizState(s => ({...s, studentsCount, subjectCounts, roomsData, roomLayouts: {}}));
                    setStep(3);
                  } catch (err) {
                    alert("Error parsing CSV files. Please check the formats.");
                  }
                }
              }} 
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3}"""

step2_next_new = """            <button 
              onClick={async () => {
                if (wizState.csv1 && wizState.csv2 && wizState.csv3 && !wizState.csvErrors.csv1 && !wizState.csvErrors.csv2 && !wizState.csvErrors.csv3) {
                  try {
                    const sText = await wizState.csv1.text();
                    const sLines = sText.split('\\n').filter(l => l.trim() !== '');
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
                    const rLines = rText.split('\\n').filter(l => l.trim() !== '');
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
              disabled={!wizState.csv1 || !wizState.csv2 || !wizState.csv3 || wizState.csvErrors.csv1 || wizState.csvErrors.csv2 || wizState.csvErrors.csv3}"""
content = content.replace(step2_next_old, step2_next_new)

# 5. Update CsvCard to accept and show error prop
csv_card_old = """function CsvCard({ type, icon, req, file, onFileChange }) {
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

csv_card_new = """function CsvCard({ type, icon, req, file, error, onFileChange }) {
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
}"""
content = content.replace(csv_card_old, csv_card_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done patching instant CSV validation")
