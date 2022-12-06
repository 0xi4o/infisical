import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
import * as Sentry from '@sentry/node';
import { PORT, SENTRY_DSN, NODE_ENV, MONGO_URL, SITE_URL, POSTHOG_PROJECT_API_KEY, POSTHOG_HOST, TELEMETRY_ENABLED } from './config';
import { apiLimiter } from './helpers/rateLimiter';

const app = express();

Sentry.init({
	dsn: SENTRY_DSN,
	tracesSampleRate: 1.0,
	debug: NODE_ENV === 'production' ? false : true,
	environment: NODE_ENV
});

import {
	signup as signupRouter,
	auth as authRouter,
	organization as organizationRouter,
	workspace as workspaceRouter,
	membershipOrg as membershipOrgRouter,
	membership as membershipRouter,
	key as keyRouter,
	inviteOrg as inviteOrgRouter,
	user as userRouter,
	userAction as userActionRouter,
	secret as secretRouter,
	serviceToken as serviceTokenRouter,
	password as passwordRouter,
	stripe as stripeRouter,
	integration as integrationRouter,
	integrationAuth as integrationAuthRouter
} from './routes';

const connectWithRetry = () => {
	mongoose.connect(MONGO_URL)
	.then(() => console.log('Successfully connected to DB'))
	.catch((e) => {
		console.log('Failed to connect to DB ', e);
		setTimeout(() => {
			console.log(e);
		}, 5000);
	});
}

connectWithRetry();

app.enable('trust proxy');
app.use(cookieParser());
app.use(cors({
	credentials: true,
	origin: SITE_URL
}));

if (NODE_ENV === 'production') {
	// enable app-wide rate-limiting + helmet security
	// in production
	app.disable('x-powered-by');
	app.use(apiLimiter);
	app.use(helmet());
}

app.use(express.json());

// routers
app.use('/api/v1/signup', signupRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/user-action', userActionRouter);
app.use('/api/v1/organization', organizationRouter);
app.use('/api/v1/workspace', workspaceRouter);
app.use('/api/v1/membership-org', membershipOrgRouter);
app.use('/api/v1/membership', membershipRouter);
app.use('/api/v1/key', keyRouter);
app.use('/api/v1/invite-org', inviteOrgRouter);
app.use('/api/v1/secret', secretRouter);
app.use('/api/v1/service-token', serviceTokenRouter);
app.use('/api/v1/password', passwordRouter);
app.use('/api/v1/stripe', stripeRouter);
app.use('/api/v1/integration', integrationRouter);
app.use('/api/v1/integration-auth', integrationAuthRouter);

app.listen(PORT, () => {
	console.log('Listening on PORT ' + PORT);
});
