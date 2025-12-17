import type { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type WAFClassType } from '../../WAFClassType';
import { type WAFResourceScope } from './WAF-Resource-Scope';

export interface NhcWAFProps {
  wafName: string;
  wafType: WAFClassType;
  wafScope: WAFResourceScope;
  wafRegion: string;
  CFNOutputIdent: string;
  CFNOutputDesc: string;
  logGroupRetention: RetentionDays;
}
