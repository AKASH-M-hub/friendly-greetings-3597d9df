import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Download, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  GraduationCap,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/ModeContext';
import jsPDF from 'jspdf';
import { SessionData } from '@/hooks/useSessionData';

interface TimetableSlot {
  day: string;
  time: string;
  activity: string;
  type: 'teaching' | 'learning' | 'free';
  duration: string;
}

interface TimetableGeneratorProps {
  sessions: SessionData[];
  mode: 'teaching' | 'learning' | null;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

export function TimetableGenerator({ sessions, mode }: TimetableGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate suggested timetable based on session history
  const generateTimetable = () => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const newTimetable: TimetableSlot[] = [];
      
      // Analyze session patterns
      const sessionsByDay: Record<string, number> = {};
      sessions.forEach(session => {
        const date = new Date(session.date);
        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
        sessionsByDay[dayName] = (sessionsByDay[dayName] || 0) + 1;
      });

      // Generate optimal schedule based on mode
      days.forEach(day => {
        // Suggest more slots on days user is typically active
        const activityLevel = sessionsByDay[day] || 0;
        const slotsForDay = Math.max(1, Math.min(3, activityLevel + 1));
        
        const availableSlots = [...timeSlots];
        for (let i = 0; i < slotsForDay && availableSlots.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableSlots.length);
          const timeSlot = availableSlots.splice(randomIndex, 1)[0];
          
          if (mode === 'teaching') {
            newTimetable.push({
              day,
              time: timeSlot,
              activity: getTeachingActivity(),
              type: 'teaching',
              duration: '1 hour'
            });
          } else if (mode === 'learning') {
            newTimetable.push({
              day,
              time: timeSlot,
              activity: getLearningActivity(),
              type: 'learning',
              duration: '1 hour'
            });
          } else {
            // Both modes
            newTimetable.push({
              day,
              time: timeSlot,
              activity: i % 2 === 0 ? getTeachingActivity() : getLearningActivity(),
              type: i % 2 === 0 ? 'teaching' : 'learning',
              duration: '1 hour'
            });
          }
        }
      });

      setTimetable(newTimetable.sort((a, b) => {
        const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      }));
      setIsGenerating(false);
      setIsExpanded(true);
    }, 1000);
  };

  const getTeachingActivity = () => {
    const activities = [
      'Live Teaching Session',
      'Seminar Preparation',
      'Student Q&A',
      'Group Workshop',
      'One-on-One Mentoring'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  };

  const getLearningActivity = () => {
    const activities = [
      'Attend Seminar',
      'Practice Session',
      'Skill Development',
      'Study & Review',
      'Group Learning'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  };

  const downloadPDF = () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor: [number, number, number] = [245, 124, 0]; // Orange
    const textColor: [number, number, number] = [33, 33, 33];
    const lightGray: [number, number, number] = [245, 245, 245];
    const teachingColor: [number, number, number] = [76, 175, 80]; // Green
    const learningColor: [number, number, number] = [33, 150, 243]; // Blue

    // Header Background
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    // Logo/Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chrono Timetable', 15, 22);

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const modeText = mode === 'teaching' ? 'Teaching Schedule' : mode === 'learning' ? 'Learning Schedule' : 'Combined Schedule';
    pdf.text(modeText, 15, 30);

    // Date
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth - 80, 22);

    // Table Settings
    const startY = 45;
    const cellWidth = (pageWidth - 30) / (days.length + 1);
    const cellHeight = 18;
    const headerHeight = 12;

    // Table Header - Time column
    pdf.setFillColor(...lightGray);
    pdf.rect(15, startY, cellWidth, headerHeight, 'F');
    pdf.setTextColor(...textColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Time', 15 + cellWidth / 2, startY + 8, { align: 'center' });

    // Table Header - Day columns
    days.forEach((day, index) => {
      const x = 15 + cellWidth * (index + 1);
      pdf.setFillColor(...primaryColor);
      pdf.rect(x, startY, cellWidth, headerHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(day.substring(0, 3), x + cellWidth / 2, startY + 8, { align: 'center' });
    });

    // Table Body
    const displayTimeSlots = timeSlots.slice(0, Math.min(9, Math.floor((pageHeight - startY - headerHeight - 20) / cellHeight)));
    
    displayTimeSlots.forEach((time, rowIndex) => {
      const y = startY + headerHeight + (rowIndex * cellHeight);
      
      // Time cell
      pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 250);
      pdf.rect(15, y, cellWidth, cellHeight, 'F');
      pdf.setTextColor(...textColor);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(time, 15 + cellWidth / 2, y + cellHeight / 2 + 2, { align: 'center' });

      // Day cells
      days.forEach((day, colIndex) => {
        const x = 15 + cellWidth * (colIndex + 1);
        const slot = timetable.find(s => s.day === day && s.time === time);

        if (slot) {
          const color = slot.type === 'teaching' ? teachingColor : learningColor;
          pdf.setFillColor(...color);
          pdf.rect(x + 2, y + 2, cellWidth - 4, cellHeight - 4, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          
          // Wrap text if needed
          const maxWidth = cellWidth - 8;
          const lines = pdf.splitTextToSize(slot.activity, maxWidth);
          pdf.text(lines[0], x + cellWidth / 2, y + cellHeight / 2, { align: 'center' });
          if (lines[1]) {
            pdf.setFontSize(6);
            pdf.text(lines[1], x + cellWidth / 2, y + cellHeight / 2 + 5, { align: 'center' });
          }
        } else {
          pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 250);
          pdf.rect(x, y, cellWidth, cellHeight, 'F');
        }

        // Cell border
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(x, y, cellWidth, cellHeight);
      });

      // Time cell border
      pdf.rect(15, y, cellWidth, cellHeight);
    });

    // Legend
    const legendY = pageHeight - 20;
    pdf.setFontSize(9);
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legend:', 15, legendY);

    // Teaching legend
    pdf.setFillColor(...teachingColor);
    pdf.rect(40, legendY - 5, 10, 6, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.text('Teaching', 53, legendY);

    // Learning legend
    pdf.setFillColor(...learningColor);
    pdf.rect(85, legendY - 5, 10, 6, 'F');
    pdf.text('Learning', 98, legendY);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Chrono - Time is Value', pageWidth - 15, legendY, { align: 'right' });

    // Save
    const fileName = `chrono-timetable-${mode || 'combined'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  // Group timetable by day for display
  const timetableByDay = useMemo(() => {
    const grouped: Record<string, TimetableSlot[]> = {};
    days.forEach(day => {
      grouped[day] = timetable.filter(slot => slot.day === day);
    });
    return grouped;
  }, [timetable]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Generate Timetable
          </div>
          {timetable.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="chrono"
            className="gap-2"
            onClick={generateTimetable}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {timetable.length > 0 ? 'Regenerate' : 'Generate'} Timetable
              </>
            )}
          </Button>
          
          {timetable.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={downloadPDF}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>

        {/* Mode Indicator */}
        {mode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mode === 'teaching' ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            Generating {mode} schedule based on your activity patterns
          </div>
        )}

        {/* Timetable Display */}
        <AnimatePresence>
          {isExpanded && timetable.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 pt-4">
                {days.map(day => {
                  const slots = timetableByDay[day];
                  if (slots.length === 0) return null;
                  
                  return (
                    <div key={day} className="rounded-lg border border-border p-3">
                      <h4 className="mb-2 font-medium text-foreground">{day}</h4>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1.5 py-1.5",
                              slot.type === 'teaching' 
                                ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                                : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {slot.time}
                            <span className="mx-1">•</span>
                            {slot.activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {timetable.length === 0 && !isGenerating && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Generate a personalized timetable based on your session history and preferences
          </p>
        )}
      </CardContent>
    </Card>
  );
}
