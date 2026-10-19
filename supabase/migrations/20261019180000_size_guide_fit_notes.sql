-- The owner's sizing advice (October 19, 2026): the Organic Oversized T-shirt runs bigger than the
-- Middleweight, so its size guide carries the size-down note, shown beside the size buttons; the
-- Middleweight's fit line describes its cut. Content only: two rows of size_guides.

update public.size_guides
   set fit = 'Oversized fit with dropped shoulders.',
       note = null,
       updated_at = now()
 where id = 'middleweight-oversized-tee';

update public.size_guides
   set fit = 'Oversized fit.',
       note = 'Size down one size for a closer fit.',
       updated_at = now()
 where id = 'organic-oversized-tee';
