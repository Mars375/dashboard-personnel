// Endpoint de rapport des violations CSP

import { Router } from 'express';
import { logger } from '../src/lib/logger';

const router = Router();

// Content-Type spécial pour les rapports CSP
router.post('/api/csp-report', (req, res) => {
	try {
		const report = req.body;

		// Extraire les informations pertinentes du rapport CSP
		const violation = {
			violatedDirective: report['csp-report']?.['violated-directive'] || 'unknown',
			blockedURI: report['csp-report']?.['blocked-uri'] || 'unknown',
			sourceFile: report['csp-report']?.['source-file'] || 'unknown',
			lineNumber: report['csp-report']?.['line-number'] || 'unknown',
			columnNumber: report['csp-report']?.['column-number'] || 'unknown',
		};

		logger.warn('CSP Violation detected:', {
			directive: violation.violatedDirective,
			blockedURI: violation.blockedURI,
			source: violation.sourceFile,
			line: violation.lineNumber,
		});

		// Répondre avec 204 No Content
		res.status(204).end();
	} catch (error) {
		logger.error('Error processing CSP report:', error);
		res.status(400).end();
	}
});

export default router;
