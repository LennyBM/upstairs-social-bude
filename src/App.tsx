import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { site } from './config/site';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Story = lazy(() => import('./pages/Story').then((m) => ({ default: m.Story })));
const FoodDrink = lazy(() => import('./pages/FoodDrink').then((m) => ({ default: m.FoodDrink })));
const SundayLunch = lazy(() => import('./pages/SundayLunch').then((m) => ({ default: m.SundayLunch })));
const Book = lazy(() => import('./pages/Book').then((m) => ({ default: m.Book })));
const Rooms = lazy(() => import('./pages/Rooms').then((m) => ({ default: m.Rooms })));
const WhatsOn = lazy(() => import('./pages/WhatsOn').then((m) => ({ default: m.WhatsOn })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const Legal = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Legal })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="our-story" element={<Story />} />
            {site.pages.food && <Route path="food-drink" element={<FoodDrink />} />}
            {site.pages.sundayLunch && <Route path="sunday-lunch" element={<SundayLunch />} />}
            {site.pages.book && <Route path="book" element={<Book />} />}
            {site.pages.rooms && <Route path="rooms" element={<Rooms />} />}
            {site.pages.whatsOn && <Route path="whats-on" element={<WhatsOn />} />}
            {site.pages.gallery && <Route path="gallery" element={<GalleryPage />} />}
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Legal kind="privacy" />} />
            <Route path="terms" element={<Legal kind="terms" />} />
            <Route path="cookies" element={<Legal kind="cookies" />} />
            <Route path="accessibility" element={<Legal kind="accessibility" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
