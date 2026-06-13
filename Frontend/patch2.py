import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\frontend\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update Step 2 next logic to parse subject_codes
step2_next_old = """                  // Count students approx
                  const sText = await wizState.csv1.text();
                  const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                  const studentsCount = Math.max(0, sLines.length - 1);"""

step2_next_new = """                  // Count students and subjects
                  const sText = await wizState.csv1.text();
                  const sLines = sText.split('\\n').filter(l => l.trim() !== '');
                  const studentsCount = Math.max(0, sLines.length - 1);
                  const headersS = sLines[0].split(',');
                  const subjIdx = headersS.findIndex(h => h.trim().toLowerCase() === 'subject_code');
                  const subjectCounts = {};
                  for(let i=1; i<sLines.length; i++) {
                    const cols = sLines[i].split(',');
                    if (cols[subjIdx]) {
                      const code = cols[subjIdx].trim();
                      subjectCounts[code] = (subjectCounts[code] || 0) + 1;
                    }
                  }"""
content = content.replace(step2_next_old, step2_next_new)

# Update state storage
state_store_old = """                  setWizState(s => ({...s, studentsCount, roomsData, roomLayouts: {}}));"""
state_store_new = """                  setWizState(s => ({...s, studentsCount, subjectCounts, roomsData, roomLayouts: {}}));"""
content = content.replace(state_store_old, state_store_new)

# Add subjectCounts to wizard state
state_init_old = """    studentsCount: 0,
    processing: false,"""
state_init_new = """    studentsCount: 0,
    subjectCounts: {},
    processing: false,"""
content = content.replace(state_init_old, state_init_new)


# Function to calculate capacity locally
calc_logic = """  // Calculate Dynamic Capacity
  const getCapacity = (state) => {
    const totalBenches = Object.keys(wizState.roomLayouts).reduce((acc, r) => acc + wizState.roomLayouts[r].seats.filter(s=>s.avail).length, 0);
    const uniqueSubjectCount = Object.keys(wizState.subjectCounts || {}).length;
    const studentsPerBench = uniqueSubjectCount <= 1 ? 1 : (state.rules?.maxPerBench || 2);
    
    let maxCapacity = 0;
    let benchesNeeded = 0;
    
    if (studentsPerBench === 1) {
      maxCapacity = totalBenches;
      benchesNeeded = wizState.studentsCount;
    } else {
      const groupSizes = Object.values(wizState.subjectCounts || {}).sort((a,b)=>b-a);
      if (groupSizes.length > 0) {
        const largestGroup = groupSizes[0];
        const othersTotal = wizState.studentsCount - largestGroup;
        if (largestGroup <= othersTotal) {
          maxCapacity = totalBenches * 2;
          benchesNeeded = Math.ceil(wizState.studentsCount / 2);
        } else {
          const pairedSlots = othersTotal * 2;
          const soloSlots = largestGroup - othersTotal;
          maxCapacity = pairedSlots + soloSlots;
          benchesNeeded = othersTotal + soloSlots;
        }
      }
    }
    return { maxCapacity, benchesNeeded, totalBenches };
  };
"""

# Update RoomLayoutsStep
rl_step_old = """function RoomLayoutsStep({ wizState, setWizState, onBack, onProceed }) {
  const [expandedRoom, setExpandedRoom] = useState(null);

  const rooms = Object.keys(wizState.roomLayouts);
  const confirmedCount = rooms.filter(r => wizState.roomLayouts[r].confirmed).length;
  const totalSelectedSeats = rooms.reduce((acc, r) => acc + wizState.roomLayouts[r].seats.filter(s=>s.avail).length, 0);"""

rl_step_new = """function RoomLayoutsStep({ wizState, setWizState, onBack, onProceed, state }) {
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
"""
content = content.replace(rl_step_old, rl_step_new)

# Fix call to RoomLayoutsStep in App.jsx
call_rl_old = """        <RoomLayoutsStep 
          wizState={wizState} 
          setWizState={setWizState} 
          onBack={()=>setStep(2)} 
          onProceed={()=>setStep(4)} 
        />"""
call_rl_new = """        <RoomLayoutsStep 
          wizState={wizState} 
          setWizState={setWizState} 
          onBack={()=>setStep(2)} 
          onProceed={()=>setStep(4)}
          state={state}
        />"""
content = content.replace(call_rl_old, call_rl_new)


# Update totalSelectedSeats to maxCapacity in UI
ui_cap_old = """          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Capacity</p>
            <p className="text-lg font-bold text-green-600">{totalSelectedSeats}</p>
          </div>"""
ui_cap_new = """          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Capacity</p>
            <p className={`text-lg font-bold ${maxCapacity >= wizState.studentsCount ? 'text-green-600' : 'text-red-600'}`}>{maxCapacity}</p>
          </div>"""
content = content.replace(ui_cap_old, ui_cap_new)

# Add Alert to RoomLayouts
alert_rl_old = """      <div className="grid grid-cols-2 gap-4 mb-8">"""
alert_rl_new = """      {maxCapacity < wizState.studentsCount && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5"/>
          <p className="text-sm font-semibold">Insufficient capacity! You have {maxCapacity} capacity but {wizState.studentsCount} students. Need {benchesNeeded} benches but only {totalBenches} are selected.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-8">"""
content = content.replace(alert_rl_old, alert_rl_new)

btn_rl_old = """        <button 
          onClick={onProceed} 
          disabled={confirmedCount !== rooms.length}"""
btn_rl_new = """        <button 
          onClick={onProceed} 
          disabled={confirmedCount !== rooms.length || maxCapacity < wizState.studentsCount}"""
content = content.replace(btn_rl_old, btn_rl_new)


# Update ConfirmStep
cf_step_old = """function ConfirmStep({ wizState, onBack, onRun }) {
  const rooms = Object.keys(wizState.roomLayouts);
  const totalSeats = rooms.reduce((acc, r) => acc + wizState.roomLayouts[r].seats.filter(s=>s.avail).length, 0);
  const surplus = totalSeats - wizState.studentsCount;"""

cf_step_new = """function ConfirmStep({ wizState, onBack, onRun, state }) {
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
"""
content = content.replace(cf_step_old, cf_step_new)

# Fix Call ConfirmStep
call_cf_old = """        <ConfirmStep 
          wizState={wizState} 
          onBack={()=>setStep(3)} 
          onRun="""
call_cf_new = """        <ConfirmStep 
          wizState={wizState} 
          onBack={()=>setStep(3)} 
          state={state}
          onRun="""
content = content.replace(call_cf_old, call_cf_new)

ui_cf_old = """        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Seats</p>
          <p className="font-bold text-gray-900 mt-1">{totalSeats}</p>
        </div>"""
ui_cf_new = """        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Capacity</p>
          <p className="font-bold text-gray-900 mt-1">{maxCapacity}</p>
        </div>"""
content = content.replace(ui_cf_old, ui_cf_new)

err_cf_old = """          <p className="text-sm">Not enough seats for all students. Please add more rooms or adjust layouts before proceeding.</p>"""
err_cf_new = """          <p className="text-sm">Not enough dynamic capacity for all students! Required benches: {benchesNeeded}, but only {totalBenches} selected.</p>"""
content = content.replace(err_cf_old, err_cf_new)


with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done patching App.jsx for dynamic capacity logic")
