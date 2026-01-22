// App.jsx - Versão Final de Produção (Sem Firebase / Estilo Integrado / Layout para Portáteis)

import React, { useState, useEffect, useCallback } from 'react';
import { 
    LucideClock, LucideCalendar, LucideUser, LucideFileText, 
    LucideBriefcase, LucideRoute, LucideDownload, 
    LucideXCircle, LucideCheckCircle, LucideAlertTriangle,
    LucideLink, LucideInfo
} from 'lucide-react';

// --- Lógica de Geração de PDF (Integrada) ---
const pdfLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/4/48/Bras%C3%A3o_de_Caruaru.png";
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error("Falha ao carregar a imagem do logotipo."));
        img.src = url;
    });
};

const generatePdf = async (data) => {
    const { jsPDF } = window.jspdf;
    const { serverName, cpf, role, route, vinculo, selectedMonth, selectedYear, timeEntries } = data;

    try {
        const logoBase64 = await loadImageAsBase64(pdfLogoUrl);
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.addImage(logoBase64, 'PNG', 10, 8, 22, 22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('SECRETARIA DE EDUCAÇÃO E ESPORTES | GERÊNCIA GERAL DE TRANSPORTE', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('FOLHA DE PONTO INDIVIDUAL', pageWidth / 2, 22, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const infoY = 38;
        
        const col1 = 38;
        const col2 = 110;
        const col3 = 160;

        const cargoCompleto = `${role || ''} / ${vinculo || ''}`;

        doc.text(`Servidor: ${serverName}`, col1, infoY);
        doc.text(`CPF: ${cpf}`, col2, infoY);
        doc.text(`Rota: ${route}`, col3, infoY);
        
        doc.text(`Cargo: ${cargoCompleto}`, col1, infoY + 6);
        doc.text(`Mês: ${selectedMonth}`, col2, infoY + 6);
        doc.text(`Ano: ${selectedYear}`, col3, infoY + 6);

        const tableBody = timeEntries.map(entry => {
            const isWeekend = ['Sábado', 'Domingo'].includes(entry.weekday);
            const isFullDayOff = ['Feriado', 'Ponto Facultativo', 'Folga', 'Falta', 'Atestado Médico', 'Recesso Escolar', 'Férias'].includes(entry.status);
            const rowStyle = (isWeekend || isFullDayOff) ? { fillColor: '#f0f0f0' } : {};
            
            if (isWeekend || isFullDayOff) {
                return [
                    { content: `${entry.day}, ${entry.weekday}`, styles: { fontStyle: 'bold', ...rowStyle } },
                    { content: entry.status || entry.weekday, colSpan: 8, styles: { halign: 'center', fontStyle: 'italic', textColor: '#555', ...rowStyle } }
                ];
            }
            return [
                { content: `${entry.day}, ${entry.weekday}`, styles: rowStyle },
                { content: entry.morning1Start, styles: rowStyle }, { content: entry.morning1End, styles: rowStyle },
                { content: entry.morning2Start, styles: rowStyle }, { content: entry.morning2End, styles: rowStyle },
                { content: entry.afternoon1Start, styles: rowStyle }, { content: entry.afternoon1End, styles: rowStyle },
                { content: entry.afternoon2Start, styles: rowStyle }, { content: entry.afternoon2End, styles: rowStyle },
            ];
        });

        doc.autoTable({
            startY: infoY + 12,
            head: [
                [{ content: 'Dia', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }, { content: 'Manhã', colSpan: 4, styles: { halign: 'center' } }, { content: 'Tarde', colSpan: 4, styles: { halign: 'center' } }],
                ['Entrada', 'Saída', 'Entrada', 'Saída', 'Entrada', 'Saída', 'Entrada', 'Saída']
            ],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 7 },
            styles: { fontSize: 7.5, cellPadding: 1.6, halign: 'center', lineWidth: 0.1, lineColor: [128, 128, 128] },
            columnStyles: { 0: { halign: 'left', cellWidth: 30, fontStyle: 'bold' } },
            didDrawPage: (data) => {
                const signatureY = pageHeight - 28;
                doc.line(20, signatureY, 90, signatureY);
                doc.text('Assinatura do Servidor', 55, signatureY + 4, { align: 'center' });
                doc.line(pageWidth - 90, signatureY, pageWidth - 20, signatureY);
                doc.text('Assinatura do Responsável pelo Setor', pageWidth - 55, signatureY + 4, { align: 'center' });
                const footerY = pageHeight - 18;
                doc.setFillColor(22, 101, 52);
                doc.rect(0, footerY, pageWidth, 18, 'F');
                doc.setFontSize(9);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('SECRETARIA DE EDUCAÇÃO E ESPORTES', pageWidth / 2, footerY + 7, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text('Avenida Cícero José Dutra, Petrópolis, Caruaru - PE - CEP 55030-580', pageWidth / 2, footerY + 12, { align: 'center' });
            },
            margin: { top: 30, bottom: 30 }
        });
        
        const nameParts = serverName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const formattedName = `${firstName}_${lastName}`.replace(/_$/, '');
        const fileName = `Ponto_${formattedName || 'Servidor'}_${selectedMonth}_${selectedYear}.pdf`;

        doc.save(fileName);
        return 'PDF gerado com sucesso!';

    } catch (error) {
        console.error("Erro na geração do PDF:", error);
        throw new Error('Erro ao gerar PDF. Verifique o console.');
    }
};

// --- Componente Principal ---
export default function App() {
    const siteLogo = "https://upload.wikimedia.org/wikipedia/commons/4/48/Bras%C3%A3o_de_Caruaru.png";
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    // --- Estilos CSS Integrados ---
    const Style = () => (
        <style>{`
            :root { --green-700: #15803d; --green-200: #bbf7d0; --green-50: #f0fdf4; --blue-500: #3b82f6; --blue-600: #2563eb; --blue-50: #dbeafe; --blue-900: #1e40af; --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db; --gray-500: #6b7280; --gray-600: #4b5563; --gray-800: #1f2937; }
            body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: var(--gray-50); color: var(--gray-800); }
            .container { width: 100%; max-width: 1440px; margin-left: auto; margin-right: auto; padding: 0 1rem; }
            .header { background-color: var(--green-700); padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 40; }
            .header-content { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 1rem; }
            @media (min-width: 640px) { .header-content { flex-direction: row; } }
            .logo-section { display: flex; align-items: center; }
            .logo-img { height: 4rem; width: auto; margin-right: 1rem; }
            .logo-text h1 { color: white; font-size: 1rem; font-weight: 600; margin: 0; }
            .logo-text h2 { color: var(--green-200); font-size: 0.8rem; margin: 0; text-transform: uppercase; }
            .logo-text h3 { color: white; font-weight: 700; font-size: 1.1rem; margin-top: 0.25rem; }
            .button { font-weight: 700; padding: 0.6rem 1.2rem; border-radius: 0.5rem; transition: all 0.2s; display: flex; align-items: center; border: none; cursor: pointer; font-size: 0.9rem; }
            .button svg { margin-right: 0.5rem; }
            .button-secondary { background-color: white; color: var(--green-700); border: 1px solid var(--gray-200); }
            .button-secondary:hover { background-color: var(--green-50); transform: translateY(-1px); }
            
            /* Banner Azul Original Revertido */
            .banner-info { background-color: var(--blue-50); color: var(--blue-900); padding: 0.85rem; border-radius: 0.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; font-size: 0.9rem; border: 1px solid #bfdbfe; line-height: 1.4; }
            .banner-info svg { margin-right: 0.75rem; flex-shrink: 0; color: var(--blue-500); }

            .form-container { background-color: white; border: 1px solid var(--gray-200); padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem; }
            .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
            .form-field { display: flex; flex-direction: column; }
            .form-label { font-size: 0.75rem; font-weight: 600; color: var(--gray-500); margin-bottom: 0.35rem; display: flex; align-items: center; text-transform: uppercase; letter-spacing: 0.025em; }
            .form-label svg { margin-right: 0.4rem; color: var(--green-700); }
            .form-input, .form-select { padding: 0.6rem; border: 1px solid var(--gray-300); border-radius: 0.4rem; font-size: 0.9rem; }
            
            .table-container { display: none; }
            @media (min-width: 1024px) { .table-container { display: block; background-color: white; padding: 0.5rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto; } }
            
            .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .table th { padding: 0.5rem; text-align: center; font-size: 0.7rem; font-weight: 700; color: var(--gray-600); background-color: var(--gray-50); border: 1px solid var(--gray-200); }
            .table td { padding: 0.4rem; border: 1px solid var(--gray-200); vertical-align: middle; }
            
            .col-day { width: 110px; }
            .col-time { width: 105px; } /* Largura otimizada para portáteis */
            .col-status { width: 165px; }

            .table .day-cell { text-align: left; padding-left: 0.5rem; }
            .table .day-cell div:first-child { font-weight: 700; color: var(--gray-800); font-size: 0.85rem; }
            .table .day-cell div:last-child { font-size: 0.6rem; color: var(--gray-500); text-transform: uppercase; }
            
            /* Input de Horário Ajustado para Windows/Chrome */
            .table .time-input { width: 88px; padding: 0.4rem 0.2rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: center; font-size: 0.9rem; font-family: 'Courier New', monospace; }
            .table .clock-button { color: var(--gray-400); background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; }
            .table .clock-button:hover { color: var(--green-700); }
            .table .status-select { width: 100%; padding: 0.35rem; border-radius: 0.25rem; border: 1px solid var(--gray-200); font-size: 0.8rem; background-color: white; cursor: pointer; }
            .disabled-row { background-color: var(--gray-100); }
            
            .mobile-cards { display: grid; gap: 1rem; }
            @media (min-width: 1024px) { .mobile-cards { display: none; } }
            .card { background-color: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--gray-200); }
            .footer { text-align: center; padding: 2rem 0; color: var(--gray-500); font-size: 0.8rem; }
        `}</style>
    );

    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    const [serverName, setServerName] = useState('');
    const [cpf, setCpf] = useState('');
    const [role, setRole] = useState('');
    const [route, setRoute] = useState('Regular');
    const [vinculo, setVinculo] = useState('Efetivo'); 
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [timeEntries, setTimeEntries] = useState([]);
    
    const createInitialTimeEntries = useCallback((year, month) => {
        const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
        const getWeekday = (y, m, d) => new Date(y, m, d).toLocaleDateString('pt-BR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
        
        const daysInMonth = getDaysInMonth(year, month);
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            return {
                day: day,
                weekday: getWeekday(year, month, day),
                morning1Start: '', morning1End: '', morning2Start: '', morning2End: '',
                afternoon1Start: '', afternoon1End: '', afternoon2Start: '', afternoon2End: '',
                status: '',
            };
        });
    }, []);

    useEffect(() => {
        setTimeEntries(createInitialTimeEntries(selectedYear, selectedMonth));
    }, [selectedYear, selectedMonth, createInitialTimeEntries]);
    
    useEffect(() => {
        if (window.jspdf && window.jspdf.jsPDF.autoTable) {
            setScriptsLoaded(true);
            return;
        }

        const jspdfScript = document.createElement('script');
        jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        jspdfScript.async = true;

        jspdfScript.onload = () => {
            const autotableScript = document.createElement('script');
            autotableScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
            autotableScript.async = true;
            autotableScript.onload = () => setScriptsLoaded(true);
            document.body.appendChild(autotableScript);
        };
        document.body.appendChild(jspdfScript);
    }, []);

    const handleTimeChange = (index, period, value) => {
        const updatedEntries = [...timeEntries];
        updatedEntries[index][period] = value;
        setTimeEntries(updatedEntries);
    };
    
    const handleStatusChange = (index, value) => {
        const updatedEntries = [...timeEntries];
        updatedEntries[index].status = value;
        setTimeEntries(updatedEntries);
    };

    const handleClockClick = (index, period) => {
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        handleTimeChange(index, period, time);
    };

    const handleCpfChange = (e) => {
        const value = e.target.value.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        setCpf(value.slice(0, 14));
    };
    
    const handleGeneratePdf = () => {
        if (!scriptsLoaded) {
            setNotification({ show: true, message: 'Recursos para PDF ainda a carregar. Tente novamente.', type: 'warn' });
            return;
        }
        const data = { serverName, cpf, role, route, vinculo, selectedMonth: months[selectedMonth], selectedYear, timeEntries };
        generatePdf(data)
            .then(message => setNotification({ show: true, message, type: 'success' }))
            .catch(error => setNotification({ show: true, message: error.message, type: 'error' }));
    };

    const NotificationComponent = () => {
        if (!notification.show) return null;
        const config = {
            info: { color: '#3b82f6', Icon: LucideInfo },
            success: { color: '#22c55e', Icon: LucideCheckCircle },
            warn: { color: '#f59e0b', Icon: LucideAlertTriangle },
            error: { color: '#ef4444', Icon: LucideXCircle },
        };
        const { color, Icon } = config[notification.type];
        return (
            <div style={{
                position: 'fixed', top: '1.25rem', right: '1.25rem', backgroundColor: color, color: 'white',
                padding: '0.75rem 1.25rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', zIndex: 100, fontWeight: '600'
            }}>
                <Icon size={18} style={{marginRight: '0.5rem'}} />{notification.message}
            </div>
        );
    };
    
    return (
        <div>
            <Style />
            <NotificationComponent />
            <header className="header">
                 <div className="container header-content">
                    <div className="logo-section">
                        <img src={siteLogo} alt="Brasão da Prefeitura de Caruaru" className="logo-img" />
                        <div className="logo-text">
                            <h1>Secretaria de Educação e Esportes</h1>
                            <h2>Gerência Geral do Transporte</h2>
                            <h3>Folha de Ponto Individual</h3>
                        </div>
                    </div>
                    <div className="header-buttons">
                        <button onClick={handleGeneratePdf} disabled={!scriptsLoaded} className="button button-secondary">
                            <LucideDownload size={18} /> Gerar PDF
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{paddingTop: '1.5rem', paddingBottom: '1.5rem'}}>
                <div className="banner-info">
                    <LucideInfo size={20} />
                    Esta é uma versão de uso rápido. Os dados inseridos não são salvos após fechar a aba. Certifique-se de gerar o PDF antes de sair.
                </div>

                 <div className="form-container">
                    <div className="form-grid">
                        <div className="form-field">
                            <label className="form-label"><LucideUser size={14} />Servidor</label>
                            <input type="text" value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="Nome completo" className="form-input"/>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideFileText size={14} />CPF</label>
                            <input type="text" value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="form-input"/>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideBriefcase size={14} />Cargo</label>
                            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cargo do servidor" className="form-input"/>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideLink size={14} />Vínculo</label>
                            <select value={vinculo} onChange={(e) => setVinculo(e.target.value)} className="form-select">
                                <option>Efetivo</option> <option>Terceirizado</option> <option>Seleção</option>
                                <option>RPA</option> <option>MEI</option> <option>Outro</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideRoute size={14} />Rota</label>
                            <select value={route} onChange={(e) => setRoute(e.target.value)} className="form-select">
                                <option>Regular</option><option>Integral</option><option>Regular + Integral</option><option>Outro</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideCalendar size={14} />Mês</label>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="form-select">
                                {months.map((month, index) => <option key={index} value={index}>{month}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label"><LucideCalendar size={14} />Ano</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="form-select">
                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="col-day" rowSpan="2">Dia</th>
                                <th colSpan="4">Manhã</th>
                                <th colSpan="4">Tarde</th>
                                <th className="col-status" rowSpan="2">Status</th>
                            </tr>
                            <tr className="sub-header">
                                <th className="col-time">Entrada</th><th className="col-time">Saída</th>
                                <th className="col-time">Entrada</th><th className="col-time">Saída</th>
                                <th className="col-time">Entrada</th><th className="col-time">Saída</th>
                                <th className="col-time">Entrada</th><th className="col-time">Saída</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeEntries.map((entry, index) => {
                                const isWeekend = ['Sábado', 'Domingo'].includes(entry.weekday);
                                const isFullDayOff = ['Feriado', 'Ponto Facultativo', 'Folga', 'Falta', 'Atestado Médico', 'Recesso Escolar', 'Férias'].includes(entry.status);
                                const isWorkDisabled = isWeekend || isFullDayOff;
                                return (
                                <tr key={`desktop-${entry.day}`} className={isWorkDisabled ? 'disabled-row' : ''}>
                                    <td className="day-cell">
                                        <div>{String(entry.day).padStart(2, '0')}</div>
                                        <div>{entry.weekday}</div>
                                    </td>
                                    {isWorkDisabled ? (
                                        <td colSpan="8" style={{textAlign: 'center', fontStyle: 'italic', color: 'var(--gray-500)', fontSize: '0.8rem'}}>
                                            {entry.status || entry.weekday}
                                        </td>
                                    ) : (
                                        <>
                                            {['morning1Start', 'morning1End', 'morning2Start', 'morning2End', 'afternoon1Start', 'afternoon1End', 'afternoon2Start', 'afternoon2End'].map((period) => (
                                                <td key={period}>
                                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                        <input type="time" value={entry[period] || ''} onChange={(e) => handleTimeChange(index, period, e.target.value)} className="time-input"/>
                                                        <button onClick={() => handleClockClick(index, period)} className="clock-button" title="Preencher hora atual">
                                                            <LucideClock size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            ))}
                                        </>
                                    )}
                                    <td>
                                        {!isWeekend && (
                                            <select value={entry.status} onChange={(e) => handleStatusChange(index, e.target.value)} className="status-select">
                                                <option value=""></option>
                                                <option value="Feriado">Feriado</option>
                                                <option value="Ponto Facultativo">Ponto Facultativo</option>
                                                <option value="Folga">Folga</option>
                                                <option value="Falta">Falta</option>
                                                <option value="Atestado Médico">Atestado Médico</option>
                                                <option value="Recesso Escolar">Recesso Escolar</option>
                                                <option value="Férias">Férias</option>
                                                <option value="Presença Parcial">Presença Parcial</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                <div className="mobile-cards">
                    {timeEntries.map((entry, index) => {
                        const isWeekend = ['Sábado', 'Domingo'].includes(entry.weekday);
                        const isFullDayOff = ['Feriado', 'Ponto Facultativo', 'Folga', 'Falta', 'Atestado Médico', 'Recesso Escolar', 'Férias'].includes(entry.status);
                        const isWorkDisabled = isWeekend || isFullDayOff;
                        return (
                        <div key={`mobile-${entry.day}`} className={`card ${isWorkDisabled ? 'disabled-row' : ''}`}>
                            <div className="card-header">
                                <span className="card-day">{String(entry.day).padStart(2, '0')} - {entry.weekday}</span>
                                {!isWeekend && (
                                    <select value={entry.status} onChange={(e) => handleStatusChange(index, e.target.value)} className="form-select" style={{width: '140px', padding: '0.3rem'}}>
                                        <option value="">Status</option>
                                        <option value="Feriado">Feriado</option><option value="Folga">Folga</option><option value="Falta">Falta</option>
                                    </select>
                                )}
                            </div>
                            {isWorkDisabled ? (
                                <p style={{textAlign: 'center', margin: '0.5rem 0', color: 'var(--gray-500)', fontSize: '0.85rem'}}>{entry.status || entry.weekday}</p>
                            ) : (
                                <div className="card-grid">
                                    {['morning1Start', 'morning1End', 'afternoon1Start', 'afternoon1End'].map((period, pIdx) => (
                                        <div key={period} className="card-field">
                                            <label>{pIdx < 2 ? 'Manhã' : 'Tarde'} - {pIdx % 2 === 0 ? 'Entrada' : 'Saída'}</label>
                                            <div style={{display: 'flex', alignItems: 'center'}}>
                                                <input type="time" value={entry[period] || ''} onChange={(e) => handleTimeChange(index, period, e.target.value)} className="form-input" style={{padding: '0.3rem', width: '100%'}}/>
                                                <button onClick={() => handleClockClick(index, period)} className="clock-button"><LucideClock size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )})}
                </div>

                <footer className="footer">
                    <p>Secretaria de Educação e Esportes de Caruaru</p>
                    <p>App de Folha de Ponto &copy; {new Date().getFullYear()} | Pronto para uso institucional</p>
                </footer>
            </main>
        </div>
    );
}