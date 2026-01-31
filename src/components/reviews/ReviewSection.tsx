import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, MessageSquare, User, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export function ReviewSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    // Use mock reviews - product_reviews table not yet created
    const mockReviews: Review[] = [
      {
        id: '1',
        rating: 5,
        review_text: 'Amazing platform for skill exchange! I learned guitar from a professional.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: 'mock-1',
        display_name: 'Alex Johnson',
        avatar_url: null,
      },
      {
        id: '2',
        rating: 4,
        review_text: 'Great concept. The time-based credit system is fair and transparent.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_id: 'mock-2',
        display_name: 'Sarah Miller',
        avatar_url: null,
      },
      {
        id: '3',
        rating: 5,
        review_text: 'Finally a platform where my teaching skills are valued equally!',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        user_id: 'mock-3',
        display_name: 'Michael Chen',
        avatar_url: null,
      },
    ];
    setReviews(mockReviews);
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }
    if (!newReview.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      // In production, this would insert into database
      const newReviewObj: Review = {
        id: crypto.randomUUID(),
        rating: newRating,
        review_text: newReview.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        display_name: 'You',
        avatar_url: null,
      };
      
      setReviews(prev => [newReviewObj, ...prev]);
      toast.success('Review submitted successfully!');
      setNewReview('');
      setNewRating(5);
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Review Our Product
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Share your experience and help others discover the value of time-based learning.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Submit Review Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Write a Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Your Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "h-8 w-8 transition-colors",
                                (hoverRating || newRating) >= star
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Your Review
                      </label>
                      <Textarea
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder="Share your experience with Chrono..."
                        className="min-h-[120px] resize-none"
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {newReview.length}/500 characters
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gap-2"
                      disabled={submitting || !newReview.trim()}
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <LogIn className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="mb-4 text-muted-foreground">
                      Please sign in to write a review
                    </p>
                    <Button onClick={() => navigate('/auth')} className="gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Reviews List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="font-display text-lg font-semibold text-foreground">
              Recent Reviews
            </h3>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-border p-4">
                    <div className="mb-2 flex gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="mb-1 h-4 w-24 rounded bg-muted" />
                        <div className="h-3 w-16 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-16 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to share your experience!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                <AnimatePresence>
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {review.avatar_url ? (
                              <img 
                                src={review.avatar_url} 
                                alt="" 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {review.display_name || 'Anonymous User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.review_text}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
