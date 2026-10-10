from __future__ import annotations
import json,sys,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock,patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from runtime import load
routes=load('calendar_routes')
try:
 from aiohttp import web
except ImportError:
 web=None

class Request:
 def __init__(self,body=None,**params):self.body=body;self.match_info=params;self.query={}
 async def json(self):return self.body

@unittest.skipUnless(web,'aiohttp required')
class CalendarRouteTest(unittest.IsolatedAsyncioTestCase):
 async def asyncSetUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.ctx=SimpleNamespace(data_dir=Path(self.tmp.name))
 async def asyncTearDown(self):self.tmp.cleanup()
 async def test_nonowner_cannot_request_access_or_start_native_write(self):
  denied=web.json_response({'error':'owner_only'},status=403)
  with patch.object(routes,'_owner',AsyncMock(return_value=denied)),patch.object(routes,'Services') as services:
   for endpoint in [routes.authorize,routes.prepare,routes.execute]:
    result=await endpoint(Request({},operation_id='a'*32),self.ctx)
    self.assertEqual(result.status,403)
   services.assert_not_called()
 async def test_invalid_new_draft_has_no_write(self):
  with patch.object(routes,'_owner',AsyncMock(return_value=None)):
   result=await routes.draft_create(Request({'title':'bad'}),self.ctx)
  self.assertEqual(result.status,400)
  self.assertFalse((self.ctx.data_dir/'drafts').exists())
 async def test_ui_create_persists_without_calling_provider(self):
  with patch.object(routes,'_owner',AsyncMock(return_value=None)),patch.object(load('apple_provider').AppleCalendarProvider,'_request',side_effect=AssertionError('No external call')):
   result=await routes.draft_create(Request({'title':'Local','start':'2030-01-02T10:00:00+09:00','end':'2030-01-02T11:00:00+09:00','timezone':'Asia/Seoul','notes':'User note'}),self.ctx)
  self.assertEqual(result.status,200)
  data=json.loads(result.text)['draft'];self.assertEqual(data['notes'],'User note');self.assertEqual(data['origin']['sessionKey'],'calendar:manual')
