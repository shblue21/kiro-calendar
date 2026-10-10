import sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from runtime import load
Settings=load('settings')
Repository=load('repository').JsonRepository
DraftError=load('domain').DraftError

class TimezoneTest(unittest.TestCase):
 def test_default_and_legacy_settings_use_same_mac_timezone(self):
  with tempfile.TemporaryDirectory() as root:
   repo=Repository(root);settings=Settings.SettingsService(repo)
   with patch.object(Settings,'system_timezone',return_value='Europe/Paris'):
    self.assertEqual(settings.read()['timezone'],'Europe/Paris')
    repo.save_settings({'schemaVersion':1,'revision':7,'timezone':'Asia/Seoul','suggestionsEnabled':False,'sessionKeys':[]})
    self.assertEqual(settings.read()['timezone'],'Europe/Paris')
    settings.update({'suggestionsEnabled':False})
    self.assertNotIn('timezone',repo.load_settings())
   with patch.object(Settings,'system_timezone',return_value='America/New_York'):
    self.assertEqual(settings.read()['timezone'],'America/New_York')
    with self.assertRaises(DraftError):settings.update({'timezone':'UTC'})
 def test_hook_uses_same_timezone_as_settings(self):
  from datetime import datetime,timezone
  contexts=load('hook_context')
  with tempfile.TemporaryDirectory() as root:
   repo=Repository(root);settings=Settings.SettingsService(repo)
   with patch.object(Settings,'system_timezone',return_value='America/New_York'):
    settings.update({'sessionKeys':['dashboard:chat-test'],'suggestionsEnabled':True})
    text=contexts.SuggestionContextService(repo,settings).for_session('dashboard:chat-test',active=True,now=datetime(2030,1,2,15,tzinfo=timezone.utc))
    self.assertIn('2030-01-02T10:00-05:00',text)
    self.assertIn('America/New_York',text)
 def test_windows_resolves_registry_zone_through_host_dependency(self):
  from types import SimpleNamespace
  module=load('timezone')
  with patch.object(module.platform,'system',return_value='Windows'),patch.dict(sys.modules,{'tzlocal':SimpleNamespace(get_localzone_name=lambda:'America/Los_Angeles')}):
   self.assertEqual(module.system_timezone(),'America/Los_Angeles')
 def test_posix_named_timezone_environment(self):
  module=load('timezone')
  with patch.object(module.platform,'system',return_value='Linux'),patch.dict(module.os.environ,{'TZ':'Europe/Paris'}):
   self.assertEqual(module.system_timezone(),'Europe/Paris')
 def test_unsupported_apple_does_not_block_connection_status(self):
  provider=load('apple_provider')
  with patch.object(provider.platform,'system',return_value='Windows'):
   state=provider.AppleCalendarProvider(Path('unused'),Path('unused')).status()
   self.assertEqual(state['state'],'unsupported')
 def test_nonposix_storage_uses_required_host_lock(self):
  from types import SimpleNamespace
  from contextlib import contextmanager
  module=load('repository'); calls=[]
  @contextmanager
  def locked(fd,**kwargs):
   calls.append(kwargs);yield
  with tempfile.TemporaryDirectory() as root,patch.object(module,'fcntl',None),patch.dict(sys.modules,{'kiro_crew.platform_compat':SimpleNamespace(file_lock=locked)}):
   repo=module.JsonRepository(root)
   with repo.transaction():repo.save_settings({'revision':1})
   self.assertEqual(repo.load_settings()['revision'],1)
  self.assertEqual(calls,[{'required':True}])
