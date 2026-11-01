# Editing commons-hub.at — a short guide

Everything you see on commons-hub.at — every page, heading, paragraph, photo,
menu entry, footer link, button text and booking price — is edited in Directus
at **https://admin.commons-hub.at**. You never need a developer to change the
content. Saved changes appear on the website within a few seconds.

## Two ways to edit

**1. Click on the page (easiest).** In Directus open **Visual Editor** (the eye
icon in the left bar) and choose commons-hub.at. The real website opens inside
Directus. Move the mouse over the page: editable parts get an outline. Click
one and a panel opens with everything in that block — text, picture, list
items and translations. Save, and the page refreshes with your change.

**2. The lists on the left.** Use these for bigger jobs (new blog post, new
event, reordering things):

| Folder | What is in it |
|---|---|
| **Website → Pages** | One entry per page. Open a page and scroll to **Sections**: these are the blocks of that page, top to bottom. Click a section to change its heading, text, picture, button and its list items (rooms, partners, links …). |
| **Blog & Events** | **Posts** (the blog), **Events**, and **Categories**. |
| **Building blocks** | **Carousels** (photo slideshows and the Gallery), **Accordions** (fold-out lists), **Team** (people on the About page). |
| **Settings** | **Site settings** (email, address, social links, the text search engines show), **Small texts** (buttons, form labels, messages), **Booking prices**, **Header menu**, **Languages**. |

## Common tasks

- **Change a photo:** open the section or item, click the picture, choose
  *Replace* or pick another file. Tip: set the *focal point* in the file's
  image editor so the important part stays visible when it is cropped.
- **Add a room / partner / footer link:** open the section, under **Items**
  click *Create new*, fill it in, and drag it to the right position.
- **Hide something without deleting it:** set its **Status** to *Hidden*. Set
  it back to *Visible* to show it again.
- **Write a blog post:** Blog & Events → Posts → *+*. Give it a title, a
  *slug* (the web address, e.g. `summer-gathering-2027`), a picture, the text,
  and set Status to *Published*.
- **Add an event:** Blog & Events → Events → *+*. Start and end date decide
  whether it is listed as upcoming or past.
- **Gallery:** each carousel whose name starts with `gallery:` is a section of
  the Gallery page. Add photos to it, drag to reorder.
- **Home page slideshow:** Building blocks → Carousels → `home_hero`. Keep that
  name exactly as it is.
- **Booking prices:** Settings → Booking prices. You can change names and
  prices; the list of options itself is fixed (the booking system depends on it).
- **Header menu:** Settings → Header menu. Each entry opens one page; its text
  is that page's title, or the entry's own *Label* if you fill one in.

## Languages

The site is in English, German, Hungarian, Czech and Slovak. The fields you
see first are **English**. Further down every item has a **Translations**
field with a tab per language. Anything left empty in a language shows the
English text instead — so a new paragraph is never missing, just untranslated.

Most German/Hungarian/Czech/Slovak texts were machine-translated and are worth
a native speaker's read.

## Good to know

- Fields marked *read-only* (like a section's **Section key** or a page's
  **Fixed route**) connect the content to the page design. They are locked on
  purpose.
- Hand-designed pages (Home, Accommodation, Event Venue, Events, About, Blog,
  Community, Gallery, Nature & Surroundings, Event Toolbox, Linktree, Footer)
  cannot be deleted, only edited. Other pages can be created and deleted freely;
  they appear at `commons-hub.at/page/<slug>`.
- Every change is recorded. To undo, open the item, click the clock icon
  (*Revisions*) on the right and restore an earlier version.
- Uploaded files are not deleted from the file library when you remove them
  from a page, so nothing breaks elsewhere.
