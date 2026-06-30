const React = require('react');

const createMockComponent = (name) => {
  const Component = (props) => React.createElement(name, props, props.children);
  Component.displayName = name;
  return Component;
};

module.exports = {
  Ionicons: createMockComponent('Ionicons'),
  MaterialCommunityIcons: createMockComponent('MaterialCommunityIcons'),
  MaterialIcons: createMockComponent('MaterialIcons'),
  FontAwesome: createMockComponent('FontAwesome'),
  FontAwesome5: createMockComponent('FontAwesome5'),
  AntDesign: createMockComponent('AntDesign'),
  Entypo: createMockComponent('Entypo'),
  Feather: createMockComponent('Feather'),
};
