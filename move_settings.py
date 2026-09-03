import re

# 1. Edit Dashboard.tsx
with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    dashboard = f.read()

# Remove Settings states from Dashboard.tsx
dashboard = re.sub(r'\s*// Settings Modal\s*const \[showSettingsModal.*?setIsSavingSettings\(false\);\s*};\s*', '\n', dashboard, flags=re.DOTALL)

# Remove Configurações button from Dashboard.tsx
dashboard = re.sub(r'<div className="grid grid-cols-1 mt-3">\s*<button\s*onClick=\{handleOpenSettings\}.*?Configurações</span>\s*</button>\s*</div>', '', dashboard, flags=re.DOTALL)

# Remove Settings Modal from Dashboard.tsx
dashboard = re.sub(r'\{/\* Modal: Configurações \*/\}.*?\{showSettingsModal && \(.*?</form>\s*</div>\s*</div>\s*\)\}', '', dashboard, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(dashboard)


# 2. Edit Services.tsx
with open('src/components/Services.tsx', 'r', encoding='utf-8') as f:
    services = f.read()

# Add states and handlers to Services.tsx
states_code = """
    const [showSettingsModal, setShowSettingsModal] = React.useState(false);
    const [pixKey, setPixKey] = React.useState('');
    const [isSavingSettings, setIsSavingSettings] = React.useState(false);

    const handleOpenSettings = async () => {
        const { settingsStorage } = await import('../utils/storage');
        const currentKey = await settingsStorage.getPixKey();
        setPixKey(currentKey || '');
        setShowSettingsModal(true);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const { settingsStorage } = await import('../utils/storage');
            await settingsStorage.savePixKey(pixKey);
            setShowSettingsModal(false);
        } catch {
            alert('Erro ao salvar as configurações.');
        } finally {
            setIsSavingSettings(false);
        }
    };
"""
services = services.replace('const [editData, setEditData] = React.useState({ name: \'\', price: \'\', duration: \'\', icon: \'\' });', 'const [editData, setEditData] = React.useState({ name: \'\', price: \'\', duration: \'\', icon: \'\' });\n' + states_code)

# Add Configurações button and Settings Modal at the end of Services.tsx main block
button_and_modal = """
                <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <button
                        onClick={handleOpenSettings}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-[0.98] transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">settings</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Configurações Gerais</p>
                                <p className="text-xs text-slate-400 font-medium">Chave PIX e outras preferências</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                </div>
            </main>

            {/* Modal: Configurações */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">settings</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Configurações</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Ajustes gerais do aplicativo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Chave PIX (Para Recebimentos)
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">pix</span>
                                        <input
                                            type="text"
                                            value={pixKey}
                                            onChange={(e) => setPixKey(e.target.value)}
                                            placeholder="Sua chave PIX (CPF, Celular, Email, Aleatória)"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Esta chave será usada para gerar as cobranças ou enviar via WhatsApp quando um agendamento estiver pendente.</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={isSavingSettings}
                                    className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-70"
                                >
                                    {isSavingSettings ? (
                                        <>
                                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">save</span>
                                            Salvar Configurações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
"""
services = services.replace('</main>', button_and_modal)

with open('src/components/Services.tsx', 'w', encoding='utf-8') as f:
    f.write(services)

