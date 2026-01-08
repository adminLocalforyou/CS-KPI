import React, { useState } from 'react';
import { 
  Camera, 
  Save, 
  Trash2, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { ProofRecord } from '../types.ts';

interface ProofVaultProps {
  proofs: ProofRecord[];
  onAdd: (record: ProofRecord) => void;
  onDelete: (id: string) => void;
}

const ProofVault: React.FC<ProofVaultProps> = ({ proofs, onAdd, onDelete }) => {
  const [selectedStaff, setSelectedStaff] = useState(TEAM_MEMBERS[0].id);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Positive' | 'Improvement' | 'Internal Note'>('Positive');
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!description) {
      alert("Please provide a description of the proof.");
      return;
    }
    const newRecord: ProofRecord = {
      id: Date.now().toString(),
      staffId: selectedStaff,
      date: new Date().toISOString().split('T')[0],
      description,
      category,
      imageUrl: image || undefined
    };
    onAdd(newRecord);
    setDescription('');
    setImage(null);
    alert("Proof added successfully!");
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Logger Panel */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
        <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-50">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
            <Camera size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manager's Proof Vault</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Log internal evidence for performance sessions</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Member</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-800 outline-none shadow-sm"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context Category</label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {(['Positive', 'Improvement', 'Internal Note'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      category === cat ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Detail</label>
            <textarea 
              rows={4}
              placeholder="Explain the evidence, case details, or specific feedback..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-bold text-slate-700 outline-none shadow-sm focus:bg-white focus:border-indigo-500 transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach Image Proof (Optional)</label>
            <div className="flex flex-col md:flex-row gap-6">
              <label className="flex-1 border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all group">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <ImageIcon size={40} className="text-slate-200 group-hover:text-blue-400 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-blue-500">Upload Screenshot</span>
              </label>
              {image && (
                <div className="relative w-full md:w-64 h-48 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl group">
                  <img src={image} className="w-full h-full object-cover" />
                  <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95"
          >
            <Save size={24} /> Log Proof to Vault
          </button>
        </div>
      </div>

      {/* Database View (Recent 5) */}
      <div className="max-w-4xl mx-auto space-y-6">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Recent Proof Logs</h4>
        <div className="space-y-4">
          {proofs.slice(0, 10).map(p => {
            const staff = TEAM_MEMBERS.find(m => m.id === p.staffId);
            return (
              <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">{staff?.name.substring(0, 2)}</div>
                  <div>
                    <p className="font-black text-slate-800">{staff?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{p.date}</p>
                  </div>
                </div>
                <div className="flex-1 truncate max-w-md text-sm text-slate-500 font-medium italic">"{p.description}"</div>
                <button onClick={() => onDelete(p.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProofVault;