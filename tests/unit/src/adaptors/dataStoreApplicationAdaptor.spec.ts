/**
 * Application API Adaptor Tests
 */

import sinon from "sinon";
import axios from "axios";

export const axiosGetStub = sinon.stub(axios, "get");

import { assert, expect, use } from "chai";
import { ApplicationDataStoreAdaptor } from '#src/adaptors/dataStoreApplicationAdaptor.js';

afterEach(() => {
  axiosGetStub.reset();
});

describe('Test Application API Adaptor', () => {
  it('Test get Applications calls axios', async () => {
    const adaptor = new ApplicationDataStoreAdaptor();
    axiosGetStub.resolves({
      data: {},
    });
    await adaptor.getApplication("123");
    sinon.assert.calledWith(axiosGetStub, "");
    console.log(axiosGetStub.getCalls);
    assert(axiosGetStub.calledOnce);
  });
});

