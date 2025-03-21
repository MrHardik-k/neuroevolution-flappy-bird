// Other techniques for learning

class ActivationFunction {
  constructor(func, dfunc) {
    this.func = func;
    this.dfunc = dfunc;
  }
}

let sigmoid = new ActivationFunction(
  (x) => 1 / (1 + Math.exp(-x)),
  (y) => y * (1 - y)
);

let tanh = new ActivationFunction(
  (x) => Math.tanh(x),
  (y) => 1 - y * y
);

class NeuralNetwork {
  /*
   * if first argument is a NeuralNetwork the constructor clones it
   * USAGE: cloned_nn = new NeuralNetwork(to_clone_nn);
   */
  constructor(in_nodes, out_nodes, hid_nodes = [1]) {
    if (in_nodes instanceof NeuralNetwork) {
      let a = in_nodes;
      this.input_nodes = a.input_nodes;
      this.hidden_nodes = a.hidden_nodes;
      this.output_nodes = a.output_nodes;
      this.layers = new Array();
      this.layers.push(a.input_nodes);

      for (var i = 0; i < a.hidden_nodes.length; i++) {
        this.layers.push(a.hidden_nodes[i]);
      }
      this.layers.push(a.output_nodes);
      this.totalLayers = a.layers.length;

      this.error;
      this.weights = new Array(a.totalLayers - 1);
      this.bias = new Array(a.totalLayers - 1);
      for (var i = 0; i < a.totalLayers - 1; i++) {
        this.weights[i] = a.weights[i].copy();
        this.bias[i] = a.bias[i].copy();
      }
    } else {
      this.input_nodes = in_nodes;
      this.hidden_nodes = hid_nodes;
      this.output_nodes = out_nodes;
      this.layers = new Array();
      this.layers.push(this.input_nodes);
      for (var i = 0; i < this.hidden_nodes.length; i++) {
        this.layers.push(this.hidden_nodes[i]);
      }
      this.layers.push(this.output_nodes);
      this.totalLayers = this.layers.length;

      this.weights = new Array(this.totalLayers - 1);
      this.bias = new Array(this.totalLayers - 1);

      for (var i = 0; i < this.weights.length; i++) {
        this.weights[i] = new Matrix(this.layers[i + 1], this.layers[i]);
        this.bias[i] = new Matrix(this.layers[i + 1], 1);

        this.weights[i].randomize();
        this.bias[i].randomize();
      }
    }

    // TODO: copy these as well
    this.setLearningRate();
    this.setActivationFunction();
  }

  predict(input_array) {
    // Generating the Hidden Outputs
    let inputs = Matrix.fromArray(input_array);
    let hidden = new Array(this.totalLayers - 1);

    hidden[0] = inputs;
    for (var i = 1; i < this.totalLayers; i++) {
      hidden[i] = Matrix.multiply(this.weights[i - 1], hidden[i - 1]);
      hidden[i].add(this.bias[i - 1]);
      hidden[i].map(this.activation_function.func);
    }
    let outputs = hidden[this.totalLayers - 1].toArray();
    return outputs;
  }

  setLearningRate(learning_rate = 0.1) {
    this.learning_rate = learning_rate;
  }

  setActivationFunction(func = sigmoid) {
    this.activation_function = func;
  }

  train(input_array, target_array) {
    // console.log("hi");
    let inputs = Matrix.fromArray(input_array);
    let hidden = new Array(this.totalLayers);

    hidden[0] = inputs;
    // hidden[0].add(this.bias[i-1]);
    // hidden[0].map(this.activation_function.func);

    for (var i = 1; i < this.totalLayers; i++) {
      hidden[i] = Matrix.multiply(this.weights[i - 1], hidden[i - 1]);
      hidden[i].add(this.bias[i - 1]);
      hidden[i].map(this.activation_function.func);
    }

    let outputs = hidden[this.totalLayers - 1];

    // Convert array to matrix object
    let targets = Matrix.fromArray(target_array);

    // Calculate the error
    // ERROR = TARGETS - OUTPUTS
    let errors = new Array(this.totalLayers - 1);
    errors[0] = Matrix.subtract(targets, outputs);
    this.error = errors[0].toArray()[0];

    for (var i = 0; i < this.totalLayers - 2; i++) {
      let weights_T = Matrix.transpose(this.weights[this.totalLayers - 2 - i]);
      errors[i + 1] = Matrix.multiply(weights_T, errors[i]);
    }

    for (var i = 0; i < this.totalLayers - 1; i++) {
      // let gradient = outputs * (1 - outputs);
      // Calculate gradients
      let gradients = Matrix.map(hidden[i + 1], this.activation_function.dfunc);
      gradients.multiply(errors[this.totalLayers - 2 - i]);
      gradients.multiply(this.learning_rate);

      // Calculate deltas
      let hidden_T = Matrix.transpose(hidden[i]);
      let weight_deltas = Matrix.multiply(gradients, hidden_T);

      // Adjust the weights by deltas
      this.weights[i].add(weight_deltas);

      // Adjust the bias by its deltas (which is just the gradients)
      this.bias[i].add(gradients);
    }
  }

  serialize() {
    return JSON.stringify(this);
  }

  static deserialize(data) {
    let nn = new NeuralNetwork(
      data.input_nodes,
      data.output_nodes,
      data.hidden_nodes
    );

    // Restore weights
    nn.weights = data.weights.map((w) => {
      let matrix = new Matrix(w.rows, w.cols);
      matrix.data = w.data;
      return matrix;
    });

    // Restore biases
    nn.bias = data.bias.map((b) => {
      let matrix = new Matrix(b.rows, b.cols);
      matrix.data = b.data;
      return matrix;
    });

    // Restore learning rate
    nn.setLearningRate(data.learning_rate);

    // Restore activation function (assuming sigmoid)
    nn.setActivationFunction(sigmoid);

    return nn;
  }

  // Adding function for neuro-evolution
  copy() {
    return new NeuralNetwork(this);
  }

  // Accept an arbitrary function for mutation
  mutate(func) {
    for (var i = 0; i < this.weights.length; i++) {
      this.weights[i].map(func);
    }
    for (var i = 0; i < this.bias.length; i++) {
      this.bias[i].map(func);
    }
  }
}
