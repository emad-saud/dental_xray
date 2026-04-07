import { Request, Response } from 'express';
import { countImages, countPatients } from '../models/patientModel';
import { countUsers } from '../models/userModel';

export async function showDashboard(req: Request, res: Response): Promise<void> {
  const currentUser = req.session.user!;
  const userCount = await countUsers();
  const patientCount = await countPatients();
  const imageCount = await countImages();

  res.render('dashboard', {
    title: 'Dashboard',
    stats: {
      userCount,
      patientCount,
      imageCount
    },
    currentUser
  });
}
