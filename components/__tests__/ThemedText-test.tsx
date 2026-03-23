import * as React from 'react';

import CustomText from '../CustomText';
import renderer from 'react-test-renderer';

it(`renders correctly`, () => {
  const tree = renderer.create(<CustomText>Snapshot test!</CustomText>).toJSON();

  expect(tree).toMatchSnapshot();
});
