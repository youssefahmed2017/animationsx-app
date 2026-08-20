-- Optional "recipe": the JS that was run through the sandboxed generator to
-- produce css_content. Purely for re-editing convenience in the publish/edit
-- form — css_content (validated, stored separately) is what's ever served or
-- trusted; js_source is never executed anywhere except through
-- /api/generate-css's sandbox, on demand, when an author re-generates.
alter table public.animations add column if not exists js_source text;
