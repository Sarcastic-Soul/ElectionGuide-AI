'use strict';

/**
 * @file tests/unit/config/security.test.js
 * @description Tests for the security configuration module.
 * Verifies CSP directives, HSTS settings, and frame protection.
 */

const { helmetConfig, cspDirectives } = require('../../../src/config/security');

describe('Security Configuration', () => {
  describe('CSP Directives', () => {
    it('should default to self only', () => {
      expect(cspDirectives.defaultSrc).toEqual(["'self'"]);
    });

    it('should restrict scripts to self', () => {
      expect(cspDirectives.scriptSrc).toContain("'self'");
    });

    it('should allow Google Fonts for styles', () => {
      expect(cspDirectives.styleSrc).toContain('https://fonts.googleapis.com');
    });

    it('should allow Google Fonts static for fonts', () => {
      expect(cspDirectives.fontSrc).toContain('https://fonts.gstatic.com');
    });

    it('should allow Google API endpoints in connect-src', () => {
      expect(cspDirectives.connectSrc).toContain('https://generativelanguage.googleapis.com');
      expect(cspDirectives.connectSrc).toContain('https://firestore.googleapis.com');
      expect(cspDirectives.connectSrc).toContain('https://texttospeech.googleapis.com');
      expect(cspDirectives.connectSrc).toContain('https://translation.googleapis.com');
    });

    it('should block object/plugin sources entirely', () => {
      expect(cspDirectives.objectSrc).toEqual(["'none'"]);
    });

    it('should block frame embedding entirely', () => {
      expect(cspDirectives.frameAncestors).toEqual(["'none'"]);
    });

    it('should restrict form actions to self', () => {
      expect(cspDirectives.formAction).toEqual(["'self'"]);
    });
  });

  describe('Helmet Configuration', () => {
    it('should enable content security policy', () => {
      expect(helmetConfig.contentSecurityPolicy).toBeDefined();
      expect(helmetConfig.contentSecurityPolicy.directives).toBe(cspDirectives);
    });

    it('should enable HSTS with 1 year max-age', () => {
      expect(helmetConfig.hsts.maxAge).toBe(31536000);
      expect(helmetConfig.hsts.includeSubDomains).toBe(true);
      expect(helmetConfig.hsts.preload).toBe(true);
    });

    it('should deny framing', () => {
      expect(helmetConfig.frameguard.action).toBe('deny');
    });

    it('should enable noSniff', () => {
      expect(helmetConfig.noSniff).toBe(true);
    });

    it('should set strict referrer policy', () => {
      expect(helmetConfig.referrerPolicy.policy).toBe('strict-origin-when-cross-origin');
    });

    it('should disable DNS prefetch', () => {
      expect(helmetConfig.dnsPrefetchControl.allow).toBe(false);
    });
  });
});
