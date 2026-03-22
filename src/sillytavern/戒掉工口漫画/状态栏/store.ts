import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../变量脚本/schema';

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });
