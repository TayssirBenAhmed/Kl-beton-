import React from 'react';
import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const EmployeeForm = ({ employee, onSuccess, onCancel }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: employee || {}
  });

  const onSubmit = async (data) => {
    try {
      if (employee) {
        await invoke('update_employe', { id: employee.id, data });
        toast.success('Employé modifié avec succès', { duration: 5000, icon: '👷' });
      } else {
        await invoke('create_employe', { data });
        toast.success('Employé créé avec succès - Il apparaîtra dans la page de pointage du chef', { duration: 5000, icon: '👷' });
        toast('Le chef pourra maintenant pointer ce nouvel employé', { icon: '📋', duration: 4000 });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Une erreur est survenue');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Matricule" {...register('employee_id', { required: true })} />
        <Input label="Nom" {...register('nom', { required: true })} />
        <Input label="Prénom" {...register('prenom')} />
        <Input label="Poste" {...register('poste')} />
        <Input label="Salaire Base" type="number" step="0.01" {...register('salaire_base', { required: true, min: 0 })} />

      </div>
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="primary">
          {employee ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};