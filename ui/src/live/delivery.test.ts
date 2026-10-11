import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DeliverySession} from './delivery.ts';
import type {CalendarItem,DeliveryResponse,Operation} from './types.ts';

function harness(mode:'app'|'provider'='provider') {
  const operation=(id:string,state:Operation['state']='prepared')=>({id,state,confirmation:{mode}} as Operation);
  const row=(op:Operation|null)=>({id:'item',revision:1,delivery:op,actions:!op || ['prepared','cancelled','failed'].includes(op.state)?['submit']:['reconcile']} as CalendarItem);
  let server=row(null), readsFail=false, lose='', nextId='fresh', writes=0;
  const calls:string[]=[], published:CalendarItem[]=[];
  const reply=()=>({item:structuredClone(server),operation:server.delivery} as DeliveryResponse);
  const session=new DeliverySession(server,{
    read:async()=>{calls.push('read');if(readsFail)throw Error('offline');return structuredClone(server);},
    prepare:async()=>{calls.push('prepare');if(!server.actions.includes('submit'))throw Error('action_unavailable');server=row(operation(nextId));if(lose==='prepare')throw Error('prepare response lost');return reply();},
    execute:async(id)=>{calls.push(`execute:${id}`);assert.equal(published.at(-1)?.delivery?.state,'prepared');if(lose==='beforeExecute')throw Error('request not delivered');if(server.delivery?.state==='prepared'){writes++;server=row(operation(id,'awaiting_confirmation'));}if(lose==='execute'){readsFail=true;throw Error('execute response lost');}return reply();},
    reconcile:async(id)=>{calls.push(`reconcile:${id}`);return reply();},
  },state=>published.push(state.item));
  return {session,calls,published,get writes(){return writes;},
    lose:(value:string)=>{lose=value;}, online:()=>{readsFail=false;lose='';},
    replace:()=>{nextId='replacement';}, complete:()=>{server=row(operation(nextId,'confirmed'));},
  };
}

test('prepare, confirm and recover delivery without replaying an accepted write',async()=>{
  const app=harness('app');await app.session.save();assert.equal(app.writes,0);
  app.replace();await app.session.save();assert.equal(app.writes,0);
  assert.equal(app.session.state.item.delivery?.state,'prepared');
  await app.session.save();assert.equal(app.writes,1);

  const lostPrepare=harness();lostPrepare.lose('prepare');await lostPrepare.session.save();
  assert.equal(lostPrepare.session.state.item.delivery?.state,'prepared');
  lostPrepare.online();await lostPrepare.session.save();assert.equal(lostPrepare.writes,1);

  const notSent=harness();notSent.lose('beforeExecute');await notSent.session.save();
  assert.equal(notSent.writes,0);notSent.online();await notSent.session.save();assert.equal(notSent.writes,1);

  const lost=harness();lost.lose('execute');await lost.session.save();
  assert.equal(lost.writes,1);assert.equal(lost.session.state.checking,true);
  assert.equal(lost.session.state.item.delivery?.state,'prepared');
  lost.online();lost.calls.length=0;await lost.session.refresh();
  assert.deepEqual(lost.calls,['read']);assert.equal(lost.session.state.item.delivery?.state,'awaiting_confirmation');
  await Promise.all([lost.session.save(),lost.session.save()]);assert.equal(lost.writes,1);
  assert.equal(lost.calls.includes('prepare'),false);
  lost.complete();await lost.session.refresh();
  assert.equal(lost.session.state.item.delivery?.state,'confirmed');assert.equal(lost.session.state.checking,false);
});
