import * as React from 'react';
import renderer from 'react-test-renderer';

import CustomText from '../CustomText';

it(`renders correctly`, () => {
  const tree = renderer.create(<CustomText>Snapshot test!</CustomText>).toJSON();

  expect(tree).toMatchSnapshot();
});
