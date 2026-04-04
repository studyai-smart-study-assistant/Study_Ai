import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BellRing, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Recurrence = 'daily' | 'weekly' | 'monthly';

interface NotificationTask {
  id: string;
  task_name: string;
  task_message: string;
  recurrence: Recurrence;
  scheduled_time: string;
  is_active: boolean;
}

const buildScheduleISO = (timeValue: string): string => {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const now = new Date();
  const schedule = new Date(now);
  schedule.setHours(hours, minutes, 0, 0);
  if (schedule <= now) schedule.setDate(schedule.getDate() + 1);
  return schedule.toISOString();
};

const TaskNotificationButton = () => {
  const [open, setOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskMessage, setTaskMessage] = useState('Time to study! Your scheduled session is ready 📚');
  const [recurrence, setRecurrence] = useState<Recurrence>('daily');
  const [timeValue, setTimeValue] = useState('19:00');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<NotificationTask[]>([]);

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('notification_tasks')
      .select('id, task_name, task_message, recurrence, scheduled_time, is_active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return;
    }

    setTasks((data || []) as NotificationTask[]);
  };

  useEffect(() => {
    if (open) {
      loadTasks();
    }
  }, [open]);

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      toast.error('Task name required');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Please login first');

      const scheduledTime = buildScheduleISO(timeValue);

      const { error: taskError } = await supabase.from('notification_tasks').upsert({
        user_id: user.id,
        task_name: taskName.trim(),
        task_message: taskMessage.trim(),
        recurrence,
        scheduled_time: scheduledTime,
        timezone,
        is_active: true,
      }, { onConflict: 'user_id,task_name' });

      if (taskError) throw taskError;

      const scheduleCount = recurrence === 'daily' ? 14 : 8;
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: `📌 ${taskName.trim()}`,
          message: taskMessage.trim(),
          scheduled_time: scheduledTime,
          recurrence,
          schedule_count: scheduleCount,
          task_name: taskName.trim(),
          timezone,
        },
      });

      if (pushError) throw pushError;

      toast.success('Task notification scheduled successfully ✅');
      setTaskName('');
      setTaskMessage('Time to study! Your scheduled session is ready 📚');
      await loadTasks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule task notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-full transition-all duration-300 hover:shadow-lg"
          title="Task reminders"
        >
          <CalendarPlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Task Notification Scheduler</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Task Name</Label>
            <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Daily Maths Revision" />
          </div>

          <div>
            <Label>Reminder Message</Label>
            <Textarea value={taskMessage} onChange={(e) => setTaskMessage(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Recurrence</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time</Label>
              <Input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleCreateTask} disabled={loading} className="w-full">
            <BellRing className="h-4 w-4 mr-2" />
            {loading ? 'Scheduling...' : 'Schedule Task Notification'}
          </Button>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Your Active Tasks</p>
            <div className="max-h-40 overflow-auto space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tasks yet.</p>
              ) : tasks.map((task) => (
                <div key={task.id} className="rounded-md border px-2 py-1 text-xs">
                  <p className="font-medium">{task.task_name}</p>
                  <p className="text-muted-foreground">{task.recurrence} • {new Date(task.scheduled_time).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskNotificationButton;
