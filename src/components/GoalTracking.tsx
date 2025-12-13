import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, TrendingUp, Calendar, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { goalsApi } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import type { Goal, GoalProgress, Quotation } from '@/types';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface GoalFormData {
  goal_type: 'revenue' | 'conversion_rate';
  target_value: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  description: string;
}

const GoalTracking = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [formData, setFormData] = useState<GoalFormData>({
    goal_type: 'revenue',
    target_value: '',
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    description: '',
  });

  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: goalsApi.getActive,
  });

  // Fetch quotations for progress calculation
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate goal progress
  const calculateProgress = (goal: Goal): GoalProgress => {
    const periodStart = new Date(goal.period_start);
    const periodEnd = new Date(goal.period_end);
    const now = new Date();

    // Filter quotations within the goal period
    const periodQuotations = quotations.filter(q => {
      const qDate = new Date(q.created_at);
      return qDate >= periodStart && qDate <= periodEnd;
    });

    let current_value = 0;

    if (goal.goal_type === 'revenue') {
      // Calculate total revenue from accepted quotations
      current_value = periodQuotations
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + Number(q.total), 0);
    } else {
      // Calculate conversion rate
      const total = periodQuotations.length;
      const accepted = periodQuotations.filter(q => q.status === 'accepted').length;
      current_value = total > 0 ? (accepted / total) * 100 : 0;
    }

    const progress_percentage = Math.min((current_value / goal.target_value) * 100, 100);

    // Calculate days remaining
    const days_remaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Determine status
    let status: GoalProgress['status'];
    if (progress_percentage >= 100) {
      status = 'achieved';
    } else if (current_value === 0) {
      status = 'not-started';
    } else if (now > periodEnd) {
      status = 'behind';
    } else {
      // Check if on track (simple linear projection)
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - days_remaining;
      const expectedProgress = (daysPassed / totalDays) * 100;
      status = progress_percentage >= expectedProgress * 0.8 ? 'on-track' : 'behind';
    }

    return {
      goal,
      current_value,
      progress_percentage,
      status,
      days_remaining,
    };
  };

  const goalProgressData = goals.map(calculateProgress);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Goal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create goal: ' + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsEditDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      toast.success('Goal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update goal: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalToDelete(null);
      toast.success('Goal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete goal: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      goal_type: 'revenue',
      target_value: '',
      period_type: 'monthly',
      period_start: '',
      period_end: '',
      description: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const goalData = {
      goal_type: formData.goal_type,
      target_value: parseFloat(formData.target_value),
      period_type: formData.period_type,
      period_start: formData.period_start,
      period_end: formData.period_end,
      description: formData.description || null,
      is_active: true,
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createMutation.mutate(goalData);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      goal_type: goal.goal_type,
      target_value: goal.target_value.toString(),
      period_type: goal.period_type,
      period_start: goal.period_start.split('T')[0],
      period_end: goal.period_end.split('T')[0],
      description: goal.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 1,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount);
  };

  const getStatusBadge = (status: GoalProgress['status']) => {
    const variants = {
      'achieved': { variant: 'default' as const, className: 'bg-green-600', icon: CheckCircle },
      'on-track': { variant: 'default' as const, className: 'bg-blue-600', icon: TrendingUp },
      'behind': { variant: 'destructive' as const, className: '', icon: AlertCircle },
      'not-started': { variant: 'secondary' as const, className: 'bg-muted', icon: Calendar },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getProgressColor = (status: GoalProgress['status']) => {
    const colors = {
      'achieved': 'bg-green-600',
      'on-track': 'bg-blue-600',
      'behind': 'bg-destructive',
      'not-started': 'bg-muted-foreground',
    };
    return colors[status];
  };

  const GoalForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal_type">Goal Type</Label>
        <Select
          value={formData.goal_type}
          onValueChange={(value: 'revenue' | 'conversion_rate') =>
            setFormData({ ...formData, goal_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue Target</SelectItem>
            <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_value">
          Target Value {formData.goal_type === 'revenue' ? '(₹)' : '(%)'}
        </Label>
        <Input
          id="target_value"
          type="number"
          step={formData.goal_type === 'revenue' ? '1000' : '0.1'}
          value={formData.target_value}
          onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
          required
          placeholder={formData.goal_type === 'revenue' ? '500000' : '75'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="period_type">Period Type</Label>
        <Select
          value={formData.period_type}
          onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') =>
            setFormData({ ...formData, period_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period_start">Start Date</Label>
          <Input
            id="period_start"
            type="date"
            value={formData.period_start}
            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period_end">End Date</Label>
          <Input
            id="period_end"
            type="date"
            value={formData.period_end}
            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Q4 2025 revenue target"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {editingGoal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Goal Tracking
          </h2>
          <p className="text-muted-foreground mt-1">Set and monitor your business goals</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a revenue or conversion rate target for a specific period.
              </DialogDescription>
            </DialogHeader>
            <GoalForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {goalProgressData.length === 0 ? (
        <Card className="premium-card glass-card luxury-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No goals set yet</p>
              <p className="text-sm">Create your first goal to start tracking your progress</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goalProgressData.map((progress) => (
            <Card key={progress.goal.id} className="premium-card glass-card luxury-border group hover:shadow-lg transition-all duration-300">
              <CardHeader className="border-b soft-divider pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl font-heading">
                        {progress.goal.goal_type === 'revenue' ? 'Revenue Target' : 'Conversion Rate'}
                      </CardTitle>
                      {getStatusBadge(progress.status)}
                    </div>
                    {progress.goal.description && (
                      <CardDescription className="text-sm">{progress.goal.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(progress.goal)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGoalToDelete(progress.goal.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-heading font-bold">
                      {progress.goal.goal_type === 'revenue'
                        ? formatCompactCurrency(progress.current_value)
                        : `${progress.current_value.toFixed(1)}%`
                      }
                    </span>
                    <span className="text-muted-foreground text-sm">
                      of {progress.goal.goal_type === 'revenue'
                        ? formatCompactCurrency(progress.goal.target_value)
                        : `${progress.goal.target_value}%`
                      }
                    </span>
                  </div>

                  <div className="relative">
                    <Progress value={progress.progress_percentage} className="h-3" />
                    <div
                      className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor(progress.status)}`}
                      style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress.progress_percentage.toFixed(1)}% Complete
                    </span>
                    <span className="text-muted-foreground">
                      {progress.days_remaining} days remaining
                    </span>
                  </div>
                </div>

                {/* Period Info */}
                <div className="flex items-center gap-4 text-sm pt-2 border-t soft-divider">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="capitalize">{progress.goal.period_type}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(progress.goal.period_start).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })} - {new Date(progress.goal.period_end).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingGoal(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your goal target and period.
            </DialogDescription>
          </DialogHeader>
          <GoalForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => goalToDelete && deleteMutation.mutate(goalToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GoalTracking;
