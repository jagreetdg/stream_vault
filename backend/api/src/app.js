import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { uploadRouter } from './routes/upload.js';
import { videoRouter } from './routes/video.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRouter);
app.use('/api/video', videoRouter);
app.use('/health', healthRouter);

app.use(errorHandler);
