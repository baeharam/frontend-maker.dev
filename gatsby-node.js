const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // 블로그 포스트 전용 템플릿 정의
  const blogPost = path.resolve(`./src/templates/blog-post.js`)

  // 날짜 기준으로 모든 마크다운 파일 가져옴
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: ASC }
          limit: 1000
        ) {
          nodes {
            id
            fields {
              slug
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      result.errors
    )
    return
  }

  const posts = result.data.allMarkdownRemark.nodes

  /**
   * 블로그 포스팅 페이지 생성
   * 하지만, "content/blog" 안에 적어도 1개의 마크다운 파일이 있을 경우에만 작동
   * "context" 는 템플릿에서 prop 으로 사용 가능하며 GraphQL 에서 변수로 사용 가능
   */

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id
      const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id

      createPage({
        path: post.fields.slug,
        component: blogPost,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  /**
   * 명시적으로 siteMetadata 객체 정의
   * 따라서, gatsby-config.js 에서 제거된다 해도 항상 정의된다.
   * 
   * 또한 명시적으로 마크다운 frontmatter 를 정의
   * 이러한 방식으로 "MarkdownRemark" 쿼리들은 블로그 포스트들이 "content/blog" 에 없더라도
   * 에러를 리턴하는 대신 "null" 을 리턴한다.
   */
  
  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
    }

    type Fields {
      slug: String
    }
  `)
}
