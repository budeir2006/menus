import React, { useState, useRef } from 'react';
import { 
  FileSearch, 
  FileUp, 
  Upload, 
  ListFilter, 
  ClipboardPaste, 
  AlertCircle, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function App() {
  const [list1Data, setList1Data] = useState<any[]>([]);
  const [list1Columns, setList1Columns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [list1, setList1] = useState<string[]>([]);
  const [list2, setList2] = useState<string[]>([]);
  const [inputMethod1, setInputMethod1] = useState<'upload' | 'paste'>('upload');
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [missingNames, setMissingNames] = useState<string[]>([]);
  const [status1, setStatus1] = useState<string>('ارفع الملف الرئيسي لاستخراج الأعمدة');
  const [status2, setStatus2] = useState<string>('ارفع الملف للمقارنة');
  const [isComparing, setIsComparing] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [pasteText1, setPasteText1] = useState('');
  const [pasteText, setPasteText] = useState('');

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length > 0) {
        setList1Data(jsonData);
        const columns = Object.keys(jsonData[0] as object);
        setList1Columns(columns);
        
        if (columns.length > 0) {
          const initialCol = columns[0];
          setSelectedColumn(initialCol);
          updateList1(jsonData, initialCol);
        }
        setStatus1(`تم استيراد ${jsonData.length} سطر`);
      }
      setHasCompared(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length > 0) {
        const columns = Object.keys(jsonData[0] as object);
        if (columns.length > 0) {
          const colName = columns[0];
          const extractedList = jsonData.map((row: any) => String(row[colName] || '').trim()).filter(Boolean);
          setList2(extractedList);
        }
        setStatus2(`تم استيراد ${jsonData.length} سطر`);
      }
      setHasCompared(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const updateList1 = (data: any[], colName: string) => {
    const extractedList = data.map(row => String(row[colName] || '').trim()).filter(Boolean);
    setList1(extractedList);
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const colName = e.target.value;
    setSelectedColumn(colName);
    updateList1(list1Data, colName);
    setHasCompared(false);
  };

  const handlePasteChange1 = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteText1(text);
    const extractedList = text.split(/\n|,/).map(n => n.trim()).filter(Boolean);
    setList1(extractedList);
    setHasCompared(false);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteText(text);
    const extractedList = text.split(/\n|,/).map(n => n.trim()).filter(Boolean);
    setList2(extractedList);
    setHasCompared(false);
  };

  const compareLists = () => {
    setIsComparing(true);
    
    setTimeout(() => {
      const set2 = new Set(list2.map(n => n.toLowerCase().trim()));
      const missing = [...new Set(list1.filter(name => !set2.has(name.toLowerCase().trim())))];
      
      setMissingNames(missing);
      setHasCompared(true);
      setIsComparing(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 500);
  };

  const downloadResults = () => {
    const ws = XLSX.utils.json_to_sheet(missingNames.map(name => ({ 'الأسماء المفقودة': name })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المفقودات");
    const fileName = inputMethod1 === 'upload' ? `المفقودات_${selectedColumn}.xlsx` : 'المفقودات.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  const canCompare = list1.length > 0 && list2.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <FileSearch className="text-indigo-600" />
            مقارن القوائم الذكي
          </h1>
          <p className="text-slate-500 italic text-sm">ارفع ملف الإكسل، اختر العمود المطلوب، وقارنه مع أي قائمة أخرى.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* List 1 - Base List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                {inputMethod1 === 'upload' ? (
                  <FileUp className="text-indigo-500 w-5 h-5" />
                ) : (
                  <ClipboardPaste className="text-indigo-500 w-5 h-5" />
                )}
                القائمة الرئيسية (المصدر)
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setInputMethod1('upload')} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMethod1 === 'upload' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  ملف
                </button>
                <button 
                  onClick={() => setInputMethod1('paste')} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMethod1 === 'paste' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  لصق
                </button>
              </div>
            </div>
            
            {inputMethod1 === 'upload' ? (
              <>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-all cursor-pointer group mb-4 flex-1 flex flex-col justify-center min-h-[150px]">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFile1}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <Upload className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2 transition-transform group-hover:-translate-y-1" />
                  <p className="text-sm font-medium text-slate-600">{status1}</p>
                </div>

                {/* Column Selection Box */}
                {list1Columns.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in">
                    <label className="block text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1">
                      <ListFilter className="w-3.5 h-3.5" />
                      اختر اسم العمود للمقارنة:
                    </label>
                    <select 
                      value={selectedColumn}
                      onChange={handleColumnChange}
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-slate-700 cursor-pointer"
                    >
                      {list1Columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <textarea 
                value={pasteText1}
                onChange={handlePasteChange1}
                placeholder="الصق القائمة الرئيسية هنا (كل اسم في سطر)..." 
                className="w-full flex-1 min-h-[180px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            )}
          </div>

          {/* List 2 - Comparison List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                {inputMethod === 'upload' ? (
                  <FileUp className="text-indigo-500 w-5 h-5" />
                ) : (
                  <ClipboardPaste className="text-indigo-500 w-5 h-5" />
                )}
                القائمة المراد فحصها
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setInputMethod('upload')} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMethod === 'upload' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  ملف
                </button>
                <button 
                  onClick={() => setInputMethod('paste')} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputMethod === 'paste' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  لصق
                </button>
              </div>
            </div>

            {inputMethod === 'upload' ? (
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-all cursor-pointer group flex-1 flex flex-col justify-center min-h-[150px]">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFile2}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <Upload className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2 transition-transform group-hover:-translate-y-1" />
                <p className="text-sm font-medium text-slate-600">{status2}</p>
              </div>
            ) : (
              <textarea 
                value={pasteText}
                onChange={handlePasteChange}
                placeholder="الصق القائمة هنا (كل اسم في سطر)..." 
                className="w-full flex-1 min-h-[180px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={compareLists} 
            disabled={!canCompare || isComparing} 
            className="group relative px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 overflow-hidden active:scale-95"
          >
            <FileSearch />
            <span>{isComparing ? 'جاري التحليل...' : 'بدء المقارنة الآن'}</span>
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef}>
          {hasCompared && missingNames.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 text-right">
                  <div className="bg-red-600 text-white p-3 rounded-2xl shadow-lg shadow-red-200">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-900 leading-none mb-1">الأسماء المفقودة: <span>{missingNames.length}</span></h3>
                    <p className="text-red-700/70 text-sm font-medium">موجودة في {inputMethod1 === 'upload' ? `عمود "${selectedColumn}"` : 'القائمة الرئيسية'} وغير موجودة في القائمة الأخرى.</p>
                  </div>
                </div>
                <button 
                  onClick={downloadResults} 
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-100"
                >
                  <Download className="w-5 h-5" />
                  تنزيل النتائج Excel
                </button>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-right border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 shadow-sm">
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="p-4 font-bold text-xs w-16 text-center">#</th>
                      <th className="p-4 font-bold text-xs">الاسم المفقود</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {missingNames.map((name, idx) => (
                      <tr key={idx} className="hover:bg-red-50/30 transition-colors group">
                        <td className="p-4 text-slate-400 font-mono text-xs text-center">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-700 group-hover:text-red-600 transition-colors">{name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasCompared && missingNames.length === 0 && (
            <div className="bg-green-50 p-16 rounded-3xl border border-green-100 text-center shadow-inner animate-in zoom-in">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-lg shadow-green-100">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <h3 className="text-3xl font-black text-green-900">البيانات متطابقة تماماً!</h3>
              <p className="text-green-700 mt-2 text-lg">لم نجد أي اسم مفقود بين القائمتين.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
