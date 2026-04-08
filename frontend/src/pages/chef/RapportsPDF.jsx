import { useState } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  User,
  FileSpreadsheet,
  Printer,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const RapportsPDF = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees] = useState([]);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'payslip',
      title: 'Fiches de paie individuelles',
      description: 'Générer les fiches de paie pour chaque employé',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 'global',
      title: 'Rapport global mensuel',
      description: 'Récapitulatif complet des salaires et charges',
      icon: FileSpreadsheet,
      color: 'bg-green-500'
    },
    {
      id: 'attendance',
      title: 'Rapport de présence',
      description: 'Détail des présences et absences',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      id: 'overtime',
      title: 'Rapport heures supplémentaires',
      description: 'Récapitulatif des heures sup par employé',
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  const handleGenerateReport = async (type) => {
    try {
      setLoading(true);
      
      let pdf;
      switch(type) {
        case 'payslip':
          pdf = await invoke('generate_payslips_pdf', {
            mois: selectedMonth,
            annee: selectedYear,
            employeeId: selectedEmployee !== 'all' ? selectedEmployee : null
          });
          break;
        case 'global':
          pdf = await invoke('generate_global_report_pdf', {
            mois: selectedMonth,
            annee: selectedYear
          });
          break;
        case 'attendance':
          pdf = await invoke('generate_attendance_report_pdf', {
            mois: selectedMonth,
            annee: selectedYear
          });
          break;
        case 'overtime':
          pdf = await invoke('generate_overtime_report_pdf', {
            mois: selectedMonth,
            annee: selectedYear
          });
          break;
        default:
          return;
      }

      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${selectedMonth}-${selectedYear}.pdf`;
      a.click();
      
      toast.success('Rapport généré avec succès');
    } catch (err) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendByEmail = async (type) => {
    try {
      await invoke('send_report_by_email', {
        type,
        mois: selectedMonth,
        annee: selectedYear,
        email: 'comptabilite@klbeton.com'
      });
      toast.success('Rapport envoyé par email');
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black text-gray-900">Rapports PDF</h1>

      {/* Filtres */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-bold mb-2">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-bold outline-none focus:border-primary-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('fr', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-2">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-bold outline-none focus:border-primary-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-2">Employé (optionnel)</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-bold outline-none focus:border-primary-500"
            >
              <option value="all">Tous les employés</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Types de rapports */}
      <div className="grid grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          
          return (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 ${report.color} rounded-2xl flex items-center justify-center`}>
                  <Icon size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{report.title}</h3>
                  <p className="text-gray-500 mt-1">{report.description}</p>
                  
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="primary"
                      icon={Download}
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={loading}
                    >
                      Générer PDF
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Mail}
                      onClick={() => handleSendByEmail(report.id)}
                    >
                      Envoyer par email
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Printer}
                    >
                      Imprimer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aperçu rapide */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Aperçu du mois {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: fr })}</h2>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Total salaires</p>
            <p className="text-3xl font-black">45,750 DT</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Charges</p>
            <p className="text-3xl font-black">12,345 DT</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Net à payer</p>
            <p className="text-3xl font-black text-green-600">33,405 DT</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Employés</p>
            <p className="text-3xl font-black">24</p>
          </div>
        </div>
      </div>
    </div>
  );
};