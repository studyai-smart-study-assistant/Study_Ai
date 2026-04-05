import { useState } from 'react';
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

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      toast.error('Task name required');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login first');

      const scheduledTime = buildScheduleISO(timeValue);
      const scheduleCount = recurrence === 'daily' ? 14 : 8;

      const { error: pushError } = await supabase.functions.invoke('notification', {
        body: {
          action: 'send',
          user_id: user.id,
          title: `📌 ${taskName.trim()}`,
          message: taskMessage.trim(),
          scheduled_time: scheduledTime,
          recurrence,
          schedule_count: scheduleCount,
          task_name: taskName.trim(),
        },
      });

      if (pushError) throw pushError;

      toast.success('Task notification scheduled successfully ✅');
      setTaskName('');
      setTaskMessage('Time to study! Your scheduled session is ready 📚');
      setOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to schedule';
      toast.error(msg);
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
          className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full transition-all duration-300"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskNotificationButton;
