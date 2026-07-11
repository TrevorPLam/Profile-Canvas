import { describe, it, expect } from 'vitest';
import { inferTopics, getTopic, TOPICS } from './topics';

describe('topics', () => {
  describe('inferTopics', () => {
    it('should infer music topic from music keywords', () => {
      expect(inferTopics('I love music and songs')).toContain('music');
    });

    it('should infer travel topic from travel keywords', () => {
      expect(inferTopics('Going on a trip abroad')).toContain('travel');
    });

    it('should infer cooking topic from cooking keywords', () => {
      expect(inferTopics('Cooking a recipe in the kitchen')).toContain('cooking');
    });

    it('should infer gaming topic from gaming keywords', () => {
      expect(inferTopics('Playing a game ranked stream')).toContain('gaming');
    });

    it('should infer photography topic from photography keywords', () => {
      expect(inferTopics('Taking a photo with my camera')).toContain('photography');
    });

    it('should infer writing topic from writing keywords', () => {
      expect(inferTopics('Writing a poem and poetry')).toContain('writing');
    });

    it('should return lifestyle as default when no keywords match', () => {
      expect(inferTopics('Just a random post')).toEqual(['lifestyle']);
    });

    it('should be case-insensitive', () => {
      expect(inferTopics('MUSIC is great')).toContain('music');
    });

    it('should return multiple topics when multiple keywords match', () => {
      const result = inferTopics('Music and travel are my passions');
      expect(result).toContain('music');
      expect(result).toContain('travel');
    });
  });

  describe('getTopic', () => {
    it('should return topic by id', () => {
      const topic = getTopic('music');
      expect(topic).toEqual(TOPICS[0]);
    });

    it('should return undefined for unknown id', () => {
      const topic = getTopic('unknown');
      expect(topic).toBeUndefined();
    });
  });
});
