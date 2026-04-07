import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import session from 'express-session';
import routes from './routes';
import { attachUser } from './middleware/auth';
import { env } from './config/env';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);
app.use(attachUser);
app.use(routes);

app.use((_req: Request, res: Response) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).render('500', {
    title: 'Something went wrong',
    message: error.message || 'Unexpected server error.'
  });
});

export default app;
