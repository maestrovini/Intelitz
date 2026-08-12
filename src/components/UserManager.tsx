import React, { useState } from 'react';
import { 
  Users, UserPlus, Trash2, Shield, User, LogOut, CheckCircle2, 
  AlertTriangle, Key, Calendar, Mail, X, Pencil
} from 'lucide-react';
import { AppUser } from '../types';
import { toTitleCase } from '../utils/formatters';


interface UserManagerProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onAddUser: (newUser: AppUser) => void;
  onUpdateUser?: (updatedUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
}

export default function UserManager({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLogout
}: UserManagerProps) {
  // Modal State - Add User
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State - Edit User
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'operator'>('operator');
  const [editFormError, setEditFormError] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const handleOpenAddModal = () => {
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserRole('operator');
    setFormError('');
    setSuccessMsg('');
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setFormError('Por favor, preencha todos os campos.');
      return;
    }

    const cleanUsername = newUserUsername.trim().toLowerCase().replace(/\s+/g, '');
    
    // Check if username already exists
    const exists = users.some(u => u.username === cleanUsername);
    if (exists) {
      setFormError('Este nome de usuário já está cadastrado.');
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: toTitleCase(newUserName.trim()),
      username: cleanUsername,
      password: newUserPassword,
      role: newUserRole,
      createdAt: new Date().toISOString()
    };

    onAddUser(newUser);
    setSuccessMsg('Usuário cadastrado com sucesso!');
    setTimeout(() => {
      setIsAddUserModalOpen(false);
      setSuccessMsg('');
    }, 1500);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword('');
    setEditRole(user.role);
    setEditFormError('');
    setEditSuccessMsg('');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError('');
    setEditSuccessMsg('');

    if (!editName.trim() || !editUsername.trim()) {
      setEditFormError('Por favor, preencha o nome e o nome de usuário.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');

    const usernameExists = users.some(u => u.id !== editingUser.id && u.username === cleanUsername);
    if (usernameExists) {
      setEditFormError('Este nome de usuário já está sendo utilizado por outra conta.');
      return;
    }

    const updatedUser: AppUser = {
      ...editingUser,
      name: toTitleCase(editName.trim()),
      username: cleanUsername,
      role: editRole,
      password: editPassword.trim() ? editPassword.trim() : editingUser.password
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setEditSuccessMsg('Usuário atualizado com sucesso!');
    setTimeout(() => {
      setEditingUser(null);
      setEditSuccessMsg('');
    }, 1200);
  };

  const handleDeleteClick = (userId: string) => {
    if (currentUser && userId === currentUser.id) {
      alert('Você não pode excluir a sua própria conta ativa.');
      return;
    }
    
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (window.confirm(`Tem certeza que deseja remover o usuário "${userToDelete.name}"?`)) {
      onDeleteUser(userId);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-2">
      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rules & Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Controle de Permissões
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-3 w-3" />
                </div>
                <div>
                  <strong className="text-zinc-800 dark:text-zinc-200 block">Administradores</strong>
                  Possuem acesso completo para visualizar, cadastrar e excluir usuários, cadastrar portais, lotes e efetuar auditorias completas.
                </div>
              </div>

              <div className="flex gap-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3" />
                </div>
                <div>
                  <strong className="text-zinc-800 dark:text-zinc-200 block">Operadores</strong>
                  Acesso operacional para realizar consultas, apenas podem alterar o valor de venda dos imóveis, não podem editar nem incluir portais, imóveis ou veículos.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Management Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                  Usuários Registrados ({users.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  Relação de contas ativas autorizadas a acessar o sistema.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Usuário
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 text-zinc-400 text-[10px] font-black uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Perfil</th>
                    <th className="py-3 px-4">Cadastro</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400 font-medium">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      return (
                        <tr key={u.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition ${isCurrent ? 'bg-emerald-500/5 dark:bg-emerald-500/2' : ''}`}>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-zinc-850 dark:text-zinc-100 block">
                              {u.name}
                              {isCurrent && (
                                <span className="ml-1.5 text-[8.5px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                                  Você
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-500 dark:text-zinc-400">
                            @{u.username}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                              u.role === 'admin' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-zinc-100 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : 'Operador'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(u)}
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-500/5 transition cursor-pointer"
                                  title="Editar Usuário (Nome, Perfil e Acesso)"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(u.id)}
                                  disabled={isCurrent}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    isCurrent
                                      ? 'border-zinc-100 dark:border-zinc-850 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-500/5'
                                  }`}
                                  title={isCurrent ? "Não é possível excluir o usuário logado" : "Excluir Usuário"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div 
              onClick={() => setIsAddUserModalOpen(false)}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
            />

            <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 text-left shadow-2xl transition-all w-full max-w-md border border-zinc-200 dark:border-zinc-800 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    Cadastrar Novo Usuário
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Nome de Usuário (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="Ex: joao.silva"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Digite a senha provisória"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Perfil de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewUserRole('operator')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        newUserRole === 'operator'
                          ? 'bg-zinc-50 dark:bg-zinc-850 border-zinc-400 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-extrabold'
                          : 'bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      Operador
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('admin')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        newUserRole === 'admin'
                          ? 'bg-emerald-50 dark:bg-emerald-950/45 border-emerald-400 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-extrabold'
                          : 'bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Administrador
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition shadow-xs"
                  >
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div 
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
            />

            <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 text-left shadow-2xl transition-all w-full max-w-md border border-zinc-200 dark:border-zinc-800 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    Editar Usuário
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editFormError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {editFormError}
                </div>
              )}

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {editSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveEditUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Nome de Usuário (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Ex: joao.silva"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Nova Senha de Acesso <span className="text-zinc-500 font-normal lowercase">(deixe em branco para não alterar)</span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Sua senha atual será mantida"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-zinc-400">
                    Perfil / Acesso de Usuário
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditRole('operator')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editRole === 'operator'
                          ? 'bg-zinc-50 dark:bg-zinc-850 border-zinc-400 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-extrabold'
                          : 'bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      Operador
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole('admin')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editRole === 'admin'
                          ? 'bg-emerald-50 dark:bg-emerald-950/45 border-emerald-400 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-extrabold'
                          : 'bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Administrador
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
