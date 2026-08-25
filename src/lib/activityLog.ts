import { db } from '@/prisma/db';

export type LogAction = 'CREATE' | 'STATUS_CHANGE' | 'DATE_UPDATE' | 'UPDATE';

export async function createActivityLog(params: {
  taskId: string;
  action: LogAction;
  oldValues?: any;
  newValues?: any;
}) {
  try {
    await db.orm.public.TaskActivityLog.create({
      taskId: params.taskId,
      action: params.action,
      oldValues: params.oldValues || null,
      newValues: params.newValues || null,
    });
  } catch (error) {
    console.error('Failed to create task activity log:', error);
  }
}
