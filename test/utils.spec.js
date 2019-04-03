/* eslint-env mocha */
const chai = require('chai');

chai.should();

const {
  filterStackArray,
  stackUrlHash,
} = require('../src/utils');

describe('Utility Functions', () => {
  describe('filterStackArray()', () => {
    it('should filter arrays by stack: dev-achieve', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'dev-achieve');
      res.should.be.an('array').to.have.lengthOf(5);
    });
    it('should filter arrays by stack: dev-achieve-uat', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'dev-achieve-uat');
      res.should.be.an('array').to.have.lengthOf(5);
    });
    it('should filter arrays by stack: int-achieve', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'int-achieve');
      res.should.be.an('array').to.have.lengthOf(5);
    });
    it('should filter arrays by stack: int-achieve-preprod', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'int-achieve-preprod');
      res.should.be.an('array').to.have.lengthOf(5);
    });
    it('should filter arrays by product: iam', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'iam');
      res.should.be.an('array').to.have.lengthOf(6);
    });
    it('should filter arrays by product: plat', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'plat');
      res.should.be.an('array').to.have.lengthOf(6);
    });
    it('should filter arrays by product: courseware', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'courseware');
      res.should.be.an('array').to.have.lengthOf(6);
    });
    it('should filter arrays by product: writing', () => {
      const array = Object.values(stackUrlHash);
      const res = filterStackArray(array, 'writing');
      res.should.be.an('array').to.have.lengthOf(10);
    });
  });
});
